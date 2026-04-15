export class BeatLeader {
    public async getPlayerInfo(playerId: string): Promise<any> {
        const response = await fetch(`./php/beatLeaderProxy.php/?playerId=${encodeURIComponent(playerId)}`);
        return await response.json();
    }
}