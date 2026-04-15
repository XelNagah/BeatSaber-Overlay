<?php
header('Content-Type: application/json; charset=utf-8');

$playerId = $_GET['playerId'] ?? null;
if (!$playerId) {
    echo json_encode(["errorMessage" => "Missing playerId"]);
    exit;
}

$cacheDir = __DIR__ . DIRECTORY_SEPARATOR . 'cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0777, true);
}

$cacheFile = $cacheDir . DIRECTORY_SEPARATOR . 'beatleader_' . preg_replace('/[^a-zA-Z0-9_\-]/', '', $playerId) . '.json';
$cacheTtlSeconds = 300; // 5 min

if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtlSeconds)) {
    readfile($cacheFile);
    exit;
}

function first_non_empty(...$values) {
    foreach ($values as $value) {
        if ($value !== null && $value !== '' && $value !== []) {
            return $value;
        }
    }
    return null;
}

function normalize_player(array $raw): ?array {
    $root = $raw;

    if (isset($root['player']) && is_array($root['player'])) {
        $player = $root['player'];
        $stats = isset($root['stats']) && is_array($root['stats']) ? $root['stats'] : ($player['stats'] ?? []);
        $root = array_merge($player, ['stats' => $stats]);
    } elseif (isset($root['data']) && is_array($root['data'])) {
        $data = $root['data'];
        $stats = isset($root['stats']) && is_array($root['stats']) ? $root['stats'] : ($data['stats'] ?? []);
        $root = array_merge($data, ['stats' => $stats]);
    }

    $stats = isset($root['stats']) && is_array($root['stats']) ? $root['stats'] : [];

    $playerName = first_non_empty(
        $root['name'] ?? null,
        $root['playerName'] ?? null,
        $root['displayName'] ?? null
    );

    $profilePicture = first_non_empty(
        $root['avatar'] ?? null,
        $root['avatarUrl'] ?? null,
        $root['profilePicture'] ?? null,
        $root['profilePictureUrl'] ?? null
    );

    $country = strtoupper((string) first_non_empty(
        $root['country'] ?? null,
        $root['countryCode'] ?? null,
        $stats['country'] ?? null
    ));

    $rank = first_non_empty(
        $root['rank'] ?? null,
        $root['globalRank'] ?? null,
        $stats['rank'] ?? null,
        $stats['globalRank'] ?? null
    );

    $countryRank = first_non_empty(
        $root['countryRank'] ?? null,
        $stats['countryRank'] ?? null
    );

    $pp = first_non_empty(
        $root['pp'] ?? null,
        $root['performancePoints'] ?? null,
        $stats['pp'] ?? null,
        $stats['performancePoints'] ?? null
    );

    if ($playerName === null && $profilePicture === null && $rank === null && $pp === null) {
        return null;
    }

    return [
        "service" => "beatleader",
        "playerName" => $playerName ?? "Unknown",
        "profilePicture" => $profilePicture ?? "./pictures/default/notFound.jpg",
        "country" => $country ?: "FR",
        "rank" => (int)($rank ?? 0),
        "countryRank" => (int)($countryRank ?? 0),
        "pp" => (float)($pp ?? 0)
    ];
}

$apiBases = [
    "https://api.beatleader.xyz",
    "https://api.beatleader.com"
];

$lastError = null;
$normalized = null;

foreach ($apiBases as $base) {
    $url = $base . "/player/" . rawurlencode($playerId);

    $context = stream_context_create([
        "http" => [
            "method" => "GET",
            "timeout" => 10,
            "header" => "User-Agent: BeatSaber-Overlay-Local/1.0\r\nAccept: application/json\r\n"
        ]
    ]);

    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        $lastError = "Request failed for " . $url;
        continue;
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        $lastError = "Invalid JSON from " . $url;
        continue;
    }

    $normalized = normalize_player($decoded);
    if ($normalized !== null) {
        break;
    }

    $lastError = "Unexpected response shape from " . $url;
}

if ($normalized === null) {
    $output = ["errorMessage" => $lastError ?? "Player not found"];
} else {
    $output = $normalized;
}

file_put_contents($cacheFile, json_encode($output, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
echo json_encode($output, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);