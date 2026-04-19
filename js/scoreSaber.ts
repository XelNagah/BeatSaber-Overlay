import { Globals } from "./global.js";
import { Tools } from "./tools.js";

export class ScoreSaber {

    /////////////////////
    // @CLASS VARIABLE //
    /////////////////////
    private _tools: Tools;

    constructor() {
        this._tools = new Tools();
    }

    /////////////////////
    // PUBLIC FUNCTION //
    /////////////////////
    public async getPlayerInfo(playerId: string): Promise<Globals.I_scoreSaberPlayerJSON> {
        return await this._tools.getMethod(Globals.SCORESABER_API_PROXY_URL + "/?playerId=" + playerId);
    }

    public async getLeaderboardInfo(hash: string, difficulty: number, gameMode: string): Promise<Globals.I_scoreSaberLeaderboardJSON> {
        return await this._tools.getMethod(
            Globals.SCORESABER_LEADERBOARD_PROXY_URL
            + "/?hash=" + encodeURIComponent(hash)
            + "&difficulty=" + difficulty
            + "&gameMode=" + encodeURIComponent(gameMode)
        );
    }

    public async getPlayerScoreOnMap(hash: string, difficulty: number, gameMode: string, playerId: string): Promise<Globals.I_scoreSaberPlayerScoreJSON> {
        return await this._tools.getMethod(
            Globals.SCORESABER_SCORE_PROXY_URL
            + "/?hash=" + encodeURIComponent(hash)
            + "&difficulty=" + difficulty
            + "&gameMode=" + encodeURIComponent(gameMode)
            + "&playerId=" + encodeURIComponent(playerId)
        );
    }
}
