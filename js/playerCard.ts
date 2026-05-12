import { Globals } from "./global.js";
import { Template } from "./template.js";
import { ScoreSaber } from "./scoreSaber.js";
import { BeatLeader } from "./beatLeader.js";

export class PlayerCard {

    ///////////////
    // @INSTANCE //
    ///////////////
    private static _instance: PlayerCard;

    /////////////////////
    // @CLASS VARIABLE //
    /////////////////////
    private _template: Template;
    private _scoreSaber: ScoreSaber;
	private _beatLeader: BeatLeader = new BeatLeader();
    private _playerInfoRequestInFlight = false;
    private static readonly FORCE_REFRESH_MAX_ATTEMPTS = 4;
    private static readonly FORCE_REFRESH_SCHEDULE_MS = [5000, 15000, 30000, 60000];

    /////////////////////
    // PUBLIC VARIABLE //
    /////////////////////
    public playerCardData: Globals.I_playerCard = {
        disabled: true,
        display: false,
        alwaysDisplayed: false,
        needUpdate: false,
        forceRefreshPending: false,
        forceRefreshAttempts: 0,
        forceRefreshNextAt: 0,
        position: "top-right",
        skin: "default",
        scale: 1.0,

        playerId: "0",
        playerName: "",
        avatar: "./pictures/default/notFound.jpg",
        playerFlag: "./pictures/country/FR.svg",
        topWorld: "0",
        topCountry: "0",
        performancePoint: "0 pp"
    };

    constructor() {
        this._template = new Template();
        this._scoreSaber = new ScoreSaber();
    }

    //////////////////////
    // PRIVATE FUNCTION //
    //////////////////////
    private async updatePlayerInfo(): Promise<void> {
        if (this._playerInfoRequestInFlight)
            return;

        if (this.playerCardData.disabled || this.playerCardData.playerId === "0")
            return;

        const now = Date.now();
        const shouldForce = this.playerCardData.forceRefreshPending
            && this.playerCardData.forceRefreshAttempts < PlayerCard.FORCE_REFRESH_MAX_ATTEMPTS
            && now >= this.playerCardData.forceRefreshNextAt;

        if (!shouldForce && !this.playerCardData.needUpdate)
            return;

        this._playerInfoRequestInFlight = true;
        try {
            this.playerCardData.needUpdate = false;

            const snapshotBefore = shouldForce
                ? this.buildProfileSnapshot()
                : "";

            try {
                await this.fetchAndApplyPlayerInfo(shouldForce);

                if (shouldForce) {
                    const snapshotAfter = this.buildProfileSnapshot();
                    if (snapshotAfter !== snapshotBefore) {
                        this.playerCardData.forceRefreshPending = false;
                        this.playerCardData.forceRefreshAttempts = 0;
                    } else {
                        this.scheduleNextForceAttempt();
                    }
                }
            } catch (_err) {
                if (shouldForce)
                    this.scheduleNextForceAttempt();
            }
        } finally {
            this._playerInfoRequestInFlight = false;
        }
    }

    private scheduleNextForceAttempt(): void {
        const attempt = this.playerCardData.forceRefreshAttempts;
        if (attempt + 1 >= PlayerCard.FORCE_REFRESH_MAX_ATTEMPTS) {
            this.playerCardData.forceRefreshPending = false;
            this.playerCardData.forceRefreshAttempts = 0;
            return;
        }

        this.playerCardData.forceRefreshAttempts = attempt + 1;
        const delayIdx = Math.min(attempt + 1, PlayerCard.FORCE_REFRESH_SCHEDULE_MS.length - 1);
        this.playerCardData.forceRefreshNextAt = Date.now() + PlayerCard.FORCE_REFRESH_SCHEDULE_MS[delayIdx];
    }

    private buildProfileSnapshot(): string {
        return this.playerCardData.performancePoint + "|"
            + this.playerCardData.topWorld + "|"
            + this.playerCardData.topCountry;
    }

    private async fetchAndApplyPlayerInfo(force: boolean): Promise<void> {
        const [scoreSaberData, beatLeaderData] = await Promise.all([
            this._scoreSaber.getPlayerInfo(this.playerCardData.playerId, force),
            this._beatLeader.getPlayerInfo(this.playerCardData.playerId, force)
        ]);

        const ssOk = scoreSaberData.errorMessage === undefined;
        const blOk = beatLeaderData.errorMessage === undefined;

        if (!ssOk && !blOk)
            return;

        this.playerCardData.playerName =
            ssOk && scoreSaberData.name !== undefined && scoreSaberData.name !== ""
                ? scoreSaberData.name
                : blOk && beatLeaderData.playerName !== undefined
                    ? beatLeaderData.playerName
                    : "";

        this.playerCardData.avatar =
            ssOk ? scoreSaberData.profilePicture :
            blOk ? beatLeaderData.profilePicture :
            "./pictures/default/notFound.jpg";

        const country =
            ssOk ? scoreSaberData.country :
            blOk ? beatLeaderData.country :
            "FR";

        const flagUrl = "./pictures/country/" + country + ".svg";
        this.playerCardData.playerFlag = flagUrl;
        const flagAbsUrl = window.location.origin + "/pictures/country/" + country + ".svg";
        document.documentElement.style.setProperty("--country-flag-url", "url('" + flagAbsUrl + "')");

        this.playerCardData.topWorld = this.buildDualMetric(
            "SS ", ssOk ? scoreSaberData.rank : null,
            "BL ", blOk ? beatLeaderData.rank : null
        );

        this.playerCardData.topCountry = this.buildDualMetric(
            "SS ", ssOk ? scoreSaberData.countryRank : null,
            "BL ", blOk ? beatLeaderData.countryRank : null
        );

        const sspp = ssOk ? scoreSaberData.pp.toFixed(2) : null;
        const blpp = blOk ? beatLeaderData.pp.toFixed(2) : null;
        if (sspp !== null && blpp !== null)
            this.playerCardData.performancePoint = "SS " + sspp + " | BL " + blpp;
        else if (sspp !== null)
            this.playerCardData.performancePoint = "SS " + sspp;
        else if (blpp !== null)
            this.playerCardData.performancePoint = "BL " + blpp;
    }
	
	private buildDualMetric(
    ssLabel: string,
    ssValue: string | number | null | undefined,
    blLabel: string,
    blValue: string | number | null | undefined,
    suffix: string = ""
): string {
    const parts: string[] = [];

    if (ssValue !== null && ssValue !== undefined) {
        parts.push(`${ssLabel}${ssValue}${suffix}`);
    }

    if (blValue !== null && blValue !== undefined) {
        parts.push(`${blLabel}${blValue}${suffix}`);
    }

    return parts.join(" | ");
}

    /////////////////////
    // PUBLIC FUNCTION //
    /////////////////////
    public async loadSkin(skinName: string) {
        if (this.playerCardData.playerId !== "0")
            this.playerCardData.disabled = false;

        if (this.playerCardData.disabled)
            return;

        if (skinName !== undefined)
            await this._template.loadSkin(Globals.E_MODULES.PLAYERCARD, skinName);
    }

    public refreshPlayerCard(): void {
        this.updatePlayerInfo().then(() => {
            this._template.refreshUI(this.playerCardData, Globals.E_MODULES.PLAYERCARD);
            this._template.moduleScale(Globals.E_MODULES.PLAYERCARD, this.playerCardData.position, this.playerCardData.scale);
            this._template.moduleCorners(Globals.E_MODULES.PLAYERCARD, this.playerCardData.position);
        });
    }

    public scheduleForcedRefresh(): void {
        if (this.playerCardData.disabled || this.playerCardData.playerId === "0")
            return;

        this.playerCardData.forceRefreshPending = true;
        this.playerCardData.forceRefreshAttempts = 0;
        this.playerCardData.forceRefreshNextAt = Date.now() + PlayerCard.FORCE_REFRESH_SCHEDULE_MS[0];
    }

    /////////////
    // GETTERS //
    /////////////
    public static get Instance(): PlayerCard {
        return this._instance || (this._instance = new this());
    }
}
