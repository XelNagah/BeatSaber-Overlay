<?php
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . "/cache.php");

$cache_system = new Cache_System();
$_SCORESABER_URL_API = "https://scoresaber.com/api/";
$_SCORESABER_API_COOLDOWN = 5 * 60;
$_PP_FACTOR = 42.1168;
$_SS_CURVE = [
    [0.0, 0.0],
    [0.6, 0.18223233667439062],
    [0.65, 0.5866010012767576],
    [0.7, 0.6125565959114954],
    [0.75, 0.6451808210101443],
    [0.8, 0.6872268862950283],
    [0.825, 0.7150465663454271],
    [0.85, 0.7462290664143185],
    [0.875, 0.7816934560296046],
    [0.9, 0.825756123560842],
    [0.91, 0.8488375988124467],
    [0.92, 0.8728710341448851],
    [0.93, 0.9039994071865736],
    [0.94, 0.9417362980580238],
    [0.95, 1.0],
    [0.955, 1.0388633331418984],
    [0.96, 1.0871883573850478],
    [0.965, 1.1552120359501035],
    [0.97, 1.2485807759957321],
    [0.9725, 1.3090333065057616],
    [0.975, 1.3807102743105126],
    [0.9775, 1.4664726399289512],
    [0.98, 1.5702410055532239],
    [0.9825, 1.697536248647543],
    [0.985, 1.8563887693647105],
    [0.9875, 2.058947159052738],
    [0.99, 2.324506282149922],
    [0.99125, 2.4902905794106913],
    [0.9925, 2.685667856592722],
    [0.99375, 2.9190155639254955],
    [0.995, 3.2022017597337955],
    [0.99625, 3.5526145337555373],
    [0.9975, 3.996793606763322],
    [0.99825, 4.325027383589547],
    [0.999, 4.715470646416203],
    [0.9995, 5.019543595874787],
    [1.0, 5.367394282890631]
];

function ss_score_error(string $message): void {
    echo json_encode(["error" => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function ss_curve_multiplier(float $acc, array $curve): float {
    $clamped = max(0.0, min(1.0, $acc));

    if ($clamped <= $curve[0][0])
        return (float)$curve[0][1];

    $last = $curve[count($curve) - 1];
    if ($clamped >= $last[0])
        return (float)$last[1];

    for ($i = 1; $i < count($curve); $i++) {
        $prev = $curve[$i - 1];
        $next = $curve[$i];

        if ($clamped <= $next[0]) {
            $ratio = ($clamped - $prev[0]) / ($next[0] - $prev[0]);
            return (float)($prev[1] + (($next[1] - $prev[1]) * $ratio));
        }
    }

    return (float)$last[1];
}

function ss_fetch_json(string $url): ?array {
    $context = stream_context_create([
        "http" => [
            "method" => "GET",
            "timeout" => 10,
            "header" => "User-Agent: BeatSaber-Overlay-Local/1.0\r\nAccept: application/json\r\n"
        ]
    ]);

    $body = @file_get_contents($url, false, $context);
    if ($body === false)
        return null;

    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

function ss_player_score_matches(array $entry, string $hash, int $difficulty, string $game_mode): bool {
    $leaderboard = isset($entry['leaderboard']) && is_array($entry['leaderboard']) ? $entry['leaderboard'] : [];
    $difficulty_info = isset($leaderboard['difficulty']) && is_array($leaderboard['difficulty']) ? $leaderboard['difficulty'] : [];

    return isset($leaderboard['songHash'], $difficulty_info['difficulty'], $difficulty_info['gameMode'])
        && is_string($leaderboard['songHash'])
        && strcasecmp($leaderboard['songHash'], $hash) === 0
        && (int)$difficulty_info['difficulty'] === $difficulty
        && (string)$difficulty_info['gameMode'] === $game_mode;
}

function ss_extract_score_pp(array $entry, float $pp_factor, array $curve): ?float {
    if (isset($entry['score']) && is_array($entry['score']) && isset($entry['score']['pp']) && is_numeric($entry['score']['pp']))
        return (float)$entry['score']['pp'];

    $score = isset($entry['score']) && is_array($entry['score']) ? $entry['score'] : $entry;
    $leaderboard = isset($entry['leaderboard']) && is_array($entry['leaderboard']) ? $entry['leaderboard'] : $entry;

    $base_score = null;
    foreach (['baseScore', 'modifiedScore', 'score'] as $key) {
        if (isset($score[$key]) && is_numeric($score[$key])) {
            $base_score = (float)$score[$key];
            break;
        }
    }

    $max_score = isset($leaderboard['maxScore']) && is_numeric($leaderboard['maxScore']) ? (float)$leaderboard['maxScore'] : null;
    $stars = isset($leaderboard['stars']) && is_numeric($leaderboard['stars']) ? (float)$leaderboard['stars'] : null;

    if ($base_score === null || $max_score === null || $stars === null || $max_score <= 0)
        return null;

    $acc = $base_score / $max_score;
    return $pp_factor * $stars * ss_curve_multiplier($acc, $curve);
}

$hash = isset($_GET["hash"]) ? trim((string)$_GET["hash"]) : "";
$difficulty = isset($_GET["difficulty"]) ? (int)$_GET["difficulty"] : 0;
$game_mode = isset($_GET["gameMode"]) ? trim((string)$_GET["gameMode"]) : "";
$player_id = isset($_GET["playerId"]) ? trim((string)$_GET["playerId"]) : "";

if ($hash === "" || $difficulty === 0 || $game_mode === "" || $player_id === "" || $player_id === "0") {
    ss_score_error("Missing required parameters");
    return;
}

$cache_key = "ssscore_" . $hash . "_" . $difficulty . "_" . $game_mode . "_" . $player_id;
if (!$cache_system->NeedRebuild($cache_key, $_SCORESABER_API_COOLDOWN)) {
    $cache_data = $cache_system->Get($cache_key);
    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }
}

$info_url = $_SCORESABER_URL_API
    . "leaderboard/by-hash/" . rawurlencode($hash)
    . "/info?difficulty=" . $difficulty
    . "&gameMode=" . rawurlencode($game_mode);

$info = ss_fetch_json($info_url);
if ($info === null) {
    $cache_data = $cache_system->Get($cache_key);
    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }

    ss_score_error("Request failed");
    return;
}

$song_name = isset($info['songName']) && is_string($info['songName']) ? trim($info['songName']) : "";
if ($song_name === "") {
    ss_score_error("Song metadata not found");
    return;
}

$search_term = substr($song_name, 0, 32);
$player_scores_url = $_SCORESABER_URL_API
    . "player/" . rawurlencode($player_id)
    . "/scores?search=" . rawurlencode($search_term)
    . "&limit=12";

$player_scores = ss_fetch_json($player_scores_url);
if ($player_scores === null || !isset($player_scores['playerScores']) || !is_array($player_scores['playerScores'])) {
    ss_score_error("Player score lookup failed");
    return;
}

$matched = null;
foreach ($player_scores['playerScores'] as $entry) {
    if (is_array($entry) && ss_player_score_matches($entry, $hash, $difficulty, $game_mode)) {
        $matched = $entry;
        break;
    }
}

if ($matched === null) {
    ss_score_error("Player score not found");
    return;
}

$pp = ss_extract_score_pp($matched, $_PP_FACTOR, $_SS_CURVE);
if ($pp === null) {
    ss_score_error("Unable to extract score PP");
    return;
}

$output = ["pp" => round($pp, 4)];
$encoded = json_encode($output, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$cache_system->Set($cache_key, $encoded);
echo $encoded;
