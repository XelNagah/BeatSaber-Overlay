<?php
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . "/cache.php");

$cache_system = new Cache_System();
$_BEATLEADER_URL_API = "https://api.beatleader.xyz/";
$_BEATLEADER_API_COOLDOWN = 5 * 60;

function bl_score_error(string $message): void {
    echo json_encode(["error" => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function bl_score_normalize_characteristic(string $characteristic): string {
    $map = [
        "Standard" => "Standard",
        "SoloStandard" => "Standard",
        "OneSaber" => "OneSaber",
        "SoloOneSaber" => "OneSaber",
        "NoArrows" => "NoArrows",
        "SoloNoArrows" => "NoArrows",
        "SoloNoArrowsRandom" => "NoArrows",
        "360Degree" => "360Degree",
        "Solo360Degree" => "360Degree",
        "90Degree" => "90Degree",
        "Solo90Degree" => "90Degree",
        "Lightshow" => "Lightshow",
        "SoloLightshow" => "Lightshow",
        "Lawless" => "Lawless",
        "SoloLawless" => "Lawless"
    ];

    $trimmed = trim($characteristic);
    return $map[$trimmed] ?? ($trimmed !== "" ? $trimmed : "Standard");
}

function bl_score_matches(mixed $entry, string $hash, string $difficulty, string $characteristic): bool {
    if (!is_array($entry))
        return false;

    $entry_hash = $entry['leaderboard']['song']['hash'] ?? null;
    $entry_difficulty = $entry['leaderboard']['difficulty']['difficultyName'] ?? null;
    $entry_characteristic = $entry['leaderboard']['difficulty']['modeName'] ?? null;

    return is_string($entry_hash)
        && is_string($entry_difficulty)
        && is_string($entry_characteristic)
        && strcasecmp($entry_hash, $hash) === 0
        && $entry_difficulty === $difficulty
        && bl_score_normalize_characteristic($entry_characteristic) === bl_score_normalize_characteristic($characteristic);
}

$hash = isset($_GET["hash"]) ? trim((string)$_GET["hash"]) : "";
$difficulty = isset($_GET["difficulty"]) ? trim((string)$_GET["difficulty"]) : "";
$characteristic = isset($_GET["characteristic"]) ? trim((string)$_GET["characteristic"]) : "";
$player_id = isset($_GET["playerId"]) ? trim((string)$_GET["playerId"]) : "";

if ($hash === "" || $difficulty === "" || $characteristic === "" || $player_id === "" || $player_id === "0") {
    bl_score_error("Missing required parameters");
    return;
}

$cache_key = "blscore_" . $hash . "_" . $difficulty . "_" . $characteristic . "_" . $player_id;
if (!$cache_system->NeedRebuild($cache_key, $_BEATLEADER_API_COOLDOWN)) {
    $cache_data = $cache_system->Get($cache_key);
    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }
}

$url = $_BEATLEADER_URL_API
    . "player/" . rawurlencode($player_id)
    . "/scores?page=1&count=50&sortBy=pp&order=desc&search=" . rawurlencode($hash);

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

    bl_score_error("Request failed");
    return;
}

$decoded = json_decode($body, true);
if (!is_array($decoded)) {
    bl_score_error("Invalid JSON response");
    return;
}

$scores = [];
if (isset($decoded['data']) && is_array($decoded['data']))
    $scores = $decoded['data'];
elseif (isset($decoded['scores']) && is_array($decoded['scores']))
    $scores = $decoded['scores'];

$best_pp = null;
foreach ($scores as $entry) {
    if (!bl_score_matches($entry, $hash, $difficulty, $characteristic))
        continue;

    if (isset($entry['pp']) && is_numeric($entry['pp'])) {
        $pp = (float)$entry['pp'];
        if ($best_pp === null || $pp > $best_pp)
            $best_pp = $pp;
    }
}

if ($best_pp === null) {
    bl_score_error("Player score not found");
    return;
}

$encoded = json_encode(["pp" => round($best_pp, 4)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$cache_system->Set($cache_key, $encoded);
echo $encoded;
