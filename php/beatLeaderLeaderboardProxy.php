<?php
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . "/cache.php");

$cache_system = new Cache_System();
$_BEATLEADER_URL_API = "https://api.beatleader.xyz/";
$_BEATLEADER_API_COOLDOWN = 60 * 60;

function bl_error(string $message): void {
    echo json_encode(["error" => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function bl_read_string(mixed $value): ?string {
    if (is_string($value))
        return $value;

    if (is_array($value)) {
        foreach (['value', 'name', 'difficultyName', 'modeName'] as $key) {
            if (isset($value[$key]) && is_string($value[$key]))
                return $value[$key];
        }
    }

    return null;
}

function bl_normalize_characteristic(string $characteristic): string {
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

function bl_extract_field(array $entry, array $paths): mixed {
    foreach ($paths as $path) {
        $current = $entry;
        $found = true;

        foreach ($path as $segment) {
            if (!is_array($current) || !array_key_exists($segment, $current)) {
                $found = false;
                break;
            }

            $current = $current[$segment];
        }

        if ($found)
            return $current;
    }

    return null;
}

function bl_match_candidate(array $entry, string $difficulty, string $characteristic): bool {
    $difficulty_value = bl_extract_field($entry, [
        ['difficulty'],
        ['difficultyName'],
        ['leaderboard', 'difficulty'],
        ['leaderboard', 'difficultyName'],
        ['difficulty', 'difficultyName'],
        ['song', 'difficulty']
    ]);

    $characteristic_value = bl_extract_field($entry, [
        ['mode'],
        ['modeName'],
        ['characteristic'],
        ['leaderboard', 'mode'],
        ['leaderboard', 'modeName'],
        ['difficulty', 'modeName'],
        ['difficulty', 'mode'],
        ['song', 'mode']
    ]);

    $difficulty_name = bl_read_string($difficulty_value);
    $characteristic_name = bl_read_string($characteristic_value);

    return $difficulty_name === $difficulty
        && bl_normalize_characteristic((string)$characteristic_name) === bl_normalize_characteristic($characteristic);
}

function bl_collect_candidates(mixed $data, array &$results): void {
    if (!is_array($data))
        return;

    $has_ratings = false;
    foreach (['accRating', 'passRating', 'techRating'] as $key) {
        if (isset($data[$key]) && is_numeric($data[$key])) {
            $has_ratings = true;
            break;
        }
    }

    if ($has_ratings)
        $results[] = $data;

    foreach ($data as $value) {
        if (is_array($value))
            bl_collect_candidates($value, $results);
    }
}

$hash = isset($_GET["hash"]) ? trim((string)$_GET["hash"]) : "";
$difficulty = isset($_GET["difficulty"]) ? trim((string)$_GET["difficulty"]) : "";
$characteristic = isset($_GET["characteristic"]) ? trim((string)$_GET["characteristic"]) : "";

if ($hash === "" || $difficulty === "" || $characteristic === "") {
    bl_error("Missing required parameters");
    return;
}

$cache_key = "bll_" . $hash . "_" . $difficulty . "_" . $characteristic;
if (!$cache_system->NeedRebuild($cache_key, $_BEATLEADER_API_COOLDOWN)) {
    $cache_data = $cache_system->Get($cache_key);
    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }
}

$url = $_BEATLEADER_URL_API . "leaderboards/hash/" . rawurlencode($hash);
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

    bl_error("Request failed");
    return;
}

$decoded = json_decode($body, true);
if (!is_array($decoded)) {
    bl_error("Invalid JSON response");
    return;
}

$candidates = [];
bl_collect_candidates($decoded, $candidates);

$matched = null;
foreach ($candidates as $candidate) {
    if (bl_match_candidate($candidate, $difficulty, $characteristic)) {
        $matched = $candidate;
        break;
    }
}

if ($matched === null && count($candidates) === 1)
    $matched = $candidates[0];

if ($matched === null) {
    bl_error("Leaderboard ratings not found");
    return;
}

$output = [
    "accRating" => isset($matched['accRating']) && is_numeric($matched['accRating']) ? (float)$matched['accRating'] : 0.0,
    "passRating" => isset($matched['passRating']) && is_numeric($matched['passRating']) ? (float)$matched['passRating'] : 0.0,
    "techRating" => isset($matched['techRating']) && is_numeric($matched['techRating']) ? (float)$matched['techRating'] : 0.0
];

if ($output["accRating"] === 0.0 && $output["passRating"] === 0.0 && $output["techRating"] === 0.0) {
    bl_error("Leaderboard ratings not found");
    return;
}

$encoded = json_encode($output, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$cache_system->Set($cache_key, $encoded);
echo $encoded;
