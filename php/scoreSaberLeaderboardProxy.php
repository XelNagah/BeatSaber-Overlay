<?php
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . "/cache.php");

$cache_system = new Cache_System();
$_SCORESABER_URL_API = "https://scoresaber.com/api/";
$_SCORESABER_API_COOLDOWN = 60 * 60;
$_PP_FACTOR = 42.1168;
$_MAX_CURVE_MULTIPLIER = 5.367394282890631;

function ss_error(string $message): void {
    echo json_encode(["error" => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function first_numeric_by_keys(mixed $data, array $keys): ?float {
    if (!is_array($data))
        return null;

    foreach ($keys as $key) {
        if (array_key_exists($key, $data) && is_numeric($data[$key]))
            return (float)$data[$key];
    }

    foreach ($data as $value) {
        if (is_array($value)) {
            $found = first_numeric_by_keys($value, $keys);
            if ($found !== null)
                return $found;
        }
    }

    return null;
}

$hash = isset($_GET["hash"]) ? trim((string)$_GET["hash"]) : "";
$difficulty = isset($_GET["difficulty"]) ? (int)$_GET["difficulty"] : 0;
$game_mode = isset($_GET["gameMode"]) ? trim((string)$_GET["gameMode"]) : "";

if ($hash === "" || $difficulty === 0 || $game_mode === "") {
    ss_error("Missing required parameters");
    return;
}

$cache_key = "ssl_" . $hash . "_" . $difficulty . "_" . $game_mode;
if (!$cache_system->NeedRebuild($cache_key, $_SCORESABER_API_COOLDOWN)) {
    $cache_data = $cache_system->Get($cache_key);
    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }
}

$url = $_SCORESABER_URL_API
    . "leaderboard/by-hash/" . rawurlencode($hash)
    . "/info?difficulty=" . $difficulty
    . "&gameMode=" . rawurlencode($game_mode);

$context = stream_context_create([
    "http" => [
        "method" => "GET",
        "timeout" => 10,
        "header" => "User-Agent: BeatSaber-Overlay-Local/1.0\r\nAccept: application/json\r\n"
    ]
]);

$body = @file_get_contents($url, false, $context);
if ($body === false) {
    $cache_data = $cache_system->Get($cache_key);
    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }

    ss_error("Request failed");
    return;
}

$decoded = json_decode($body, true);
if (!is_array($decoded)) {
    ss_error("Invalid JSON response");
    return;
}

$stars = first_numeric_by_keys($decoded, ["stars", "starRating"]);
$max_pp = first_numeric_by_keys($decoded, ["maxPP"]);

if ($stars === null && $max_pp === null) {
    ss_error("Unable to extract leaderboard PP data");
    return;
}

if (($max_pp === null || $max_pp < 0) && $stars !== null && $stars > 0)
    $max_pp = $_PP_FACTOR * $stars * $_MAX_CURVE_MULTIPLIER;

if ($max_pp === null || $max_pp < 0)
    $max_pp = 0.0;

if ($stars === null)
    $stars = 0.0;

$output = [
    "maxPP" => round((float)$max_pp, 4),
    "stars" => round((float)$stars, 4)
];

$encoded = json_encode($output, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$cache_system->Set($cache_key, $encoded);
echo $encoded;
