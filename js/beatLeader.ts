import { Globals } from "./global.js";
import { Tools } from "./tools.js";

export class BeatLeader {
    private _tools: Tools;

    constructor() {
        this._tools = new Tools();
    }

    public async getPlayerInfo(playerId: string): Promise<Globals.I_beatLeaderPlayerJSON> {
        return await this._tools.getMethod(`./php/beatLeaderProxy.php/?playerId=${encodeURIComponent(playerId)}`);
    }

    public async getLeaderboardInfo(hash: string, difficulty: string, characteristic: string): Promise<Globals.I_beatLeaderLeaderboardJSON> {
        return await this._tools.getMethod(
            Globals.BEATLEADER_LEADERBOARD_PROXY_URL
            + "/?hash=" + encodeURIComponent(hash)
            + "&difficulty=" + encodeURIComponent(difficulty)
            + "&characteristic=" + encodeURIComponent(characteristic)
        );
    }

    public async getPlayerScoreOnMap(hash: string, difficulty: string, characteristic: string, playerId: string): Promise<Globals.I_beatLeaderPlayerScoreJSON> {
        return await this._tools.getMethod(
            Globals.BEATLEADER_SCORE_PROXY_URL
            + "/?hash=" + encodeURIComponent(hash)
            + "&difficulty=" + encodeURIComponent(difficulty)
            + "&characteristic=" + encodeURIComponent(characteristic)
            + "&playerId=" + encodeURIComponent(playerId)
        );
    }
}
