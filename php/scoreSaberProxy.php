<?php
require_once(__DIR__ . "/cache.php");
$cache_system = new Cache_System();

$_SCORESABER_URL_API = "https://scoresaber.com/api/";
$_SCORESABER_API_COOLDOWN = 2 * 60;
$_SCORESABER_FORCE_COOLDOWN = 10;
$_SCORESABER_DEFAULT_PLAYER_ID = 0;

$_DEFAULT_MSG_ERROR = '{
    "errorMessage": "Player not found"
}';

if (!isset($_GET["playerId"]) || $_GET["playerId"] === "0") {
    echo $_DEFAULT_MSG_ERROR;
    return;
}

$player_id = (is_numeric($_GET["playerId"])) ? $_GET["playerId"] : $_SCORESABER_DEFAULT_PLAYER_ID;
$cache_key = "ssprofile_" . $player_id;
$cache_data = "";
$force = isset($_GET["force"]) && $_GET["force"] === "1";

$cooldownDir = __DIR__ . DIRECTORY_SEPARATOR . "Cache";
if (!is_dir($cooldownDir)) {
    @mkdir($cooldownDir, 0777, true);
}
$cooldownFile = $cooldownDir . DIRECTORY_SEPARATOR
    . "ss_force_ts_" . preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$player_id) . ".txt";

if ($force) {
    $lastForced = file_exists($cooldownFile) ? (int)file_get_contents($cooldownFile) : 0;
    if ((time() - $lastForced) < $_SCORESABER_FORCE_COOLDOWN) {
        $cache_data = $cache_system->Get($cache_key);

        if ($cache_data !== null && json_encode($cache_data) !== "false") {
            echo $cache_data;
            return;
        }

        echo $_DEFAULT_MSG_ERROR;
        return;
    }

    @file_put_contents($cooldownFile, (string)time());
}

if (!$force && !$cache_system->NeedRebuild($cache_key, $_SCORESABER_API_COOLDOWN)) {
    $cache_data = $cache_system->Get($cache_key);

    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }
}

$json_data = @file_get_contents(
    $_SCORESABER_URL_API . "player/" . $player_id . "/basic"
);

if (json_encode($json_data) !== "false") {
    if (!$force) {
        $cache_system->Set($cache_key, $json_data);
    }
    echo $json_data;
    return;
} else {
    $cache_data = $cache_system->Get($cache_key);

    if ($cache_data !== null && json_encode($cache_data) !== "false") {
        echo $cache_data;
        return;
    }
}

echo $_DEFAULT_MSG_ERROR;
