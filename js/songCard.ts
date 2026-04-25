import { Globals } from "./global.js";
import { Template } from "./template.js";
import { BeatSaver } from "./beatSaver.js";
import { ScoreSaber } from "./scoreSaber.js";
import { BeatLeader } from "./beatLeader.js";
import { PlayerCard } from "./playerCard.js";
import { PPCalculator } from "./ppCalculator.js";

export class SongCard {

    ///////////////
    // @INSTANCE //
    ///////////////
    private static _instance: SongCard;

    /////////////////////
    // @CLASS VARIABLE //
    /////////////////////
    private _template: Template;
    private _beatSaver: BeatSaver;
    private _scoreSaber: ScoreSaber;
    private _beatLeader: BeatLeader;
    private _mapToken = "";
    private _lastPid = "";
    private _ssMapMaxPP = 0;
    private _blAccRating = 0;
    private _blPassRating = 0;
    private _blTechRating = 0;
    private _playerBestSSPP = 0;
    private _playerBestBLPP = 0;

    /////////////////////
    // PUBLIC VARIABLE //
    /////////////////////
    public songCardData: Globals.I_songCard = {
        disabled: false,
        alwaysDisplayed: false,
        needUpdate: false,
        position: "bottom-left",
        skin: "default",
        scale: 1.0,

        started: false,
        inProgress: false,
        paused: false,
        finished: false,

        displayMiss: false,

        cover: "https://eu.cdn.beatsaver.com/280378d7157542f5b160e8a464f0dcfdc3a1de56.jpg",
        title: "Love yiff!",
        subTitle: "Subtitle",
        mapper: "Yasu",
        author: "Camellia",

        bsrKey: "2319e",
        hashMap: "280378d7157542f5b160e8a464f0dcfdc3a1de56",
        bpm: 272,

        difficulty: "Expert+",
        difficultyClass: "ExpertPlus",
        characteristic: "Standard",

        ranked: false,
        qualified: false,
        pp: 0,

        time: 137000,
        totalTime: 274000,
        timeToLetters: "2:17",
        totalTimeToLetters: "4:24",
        timeToPercentage: 50,

        accuracy: 69.69,
        accuracyToLetters: "A",
        accuracyToLetterClass: "a",

        score: "124,256",
        combo: 234,
        miss: 2,

        health: 100,

        speedModifier: 1,

        ssPP: "",
        blPP: "",
        ssDelta: "",
        blDelta: "",
        mapPPDelta: ""
    };

    constructor() {
        this._template = new Template();
        this._beatSaver = new BeatSaver();
        this._scoreSaber = new ScoreSaber();
        this._beatLeader = new BeatLeader();

        this.timerSong();
    }

    //////////////////////
    // PRIVATE FUNCTION //
    //////////////////////
    private timerSong(): void {
        setInterval(() => {
            if (this.songCardData.disabled
                || this.songCardData.paused
                || !this.songCardData.inProgress)
                return;

            if (!this.songCardData.started) {
                this.songCardData.time = 0;
                this.songCardData.totalTime = 0;
                this.songCardData.timeToLetters = "0:00";
                this.songCardData.timeToPercentage = 0;
                return;
            }

            if (this.songCardData.finished) {
                this.songCardData.time = this.songCardData.totalTime;
                this.songCardData.timeToLetters = this.timeToLetters(this.songCardData.time);
                this.songCardData.timeToPercentage = 100;
                return;
            }

            if (this.songCardData.inProgress) {
                this.songCardData.time += (100 * this.songCardData.speedModifier);
                this.songCardData.timeToLetters = this.timeToLetters(this.songCardData.time);
                this.songCardData.timeToPercentage = this.timeToPercentage();
            }
        }, Globals.MS_TIMER);
    }

    private accuracyToLetter(): "A" | "SS" | "S" | "B" | "C" | "D" | "E" {
        if (this.songCardData.accuracy >= 90)
            return "SS";

        if (this.songCardData.accuracy < 90 && this.songCardData.accuracy >= 80)
            return "S";

        if (this.songCardData.accuracy < 80 && this.songCardData.accuracy >= 65)
            return "A";

        if (this.songCardData.accuracy < 65 && this.songCardData.accuracy >= 50)
            return "B";

        if (this.songCardData.accuracy < 50 && this.songCardData.accuracy >= 35)
            return "C";

        if (this.songCardData.accuracy < 35 && this.songCardData.accuracy >= 20)
            return "D";

        if (this.songCardData.accuracy < 20)
            return "E";

        return "E";
    }

    private accuracyToLetterClass(): "a" | "ss" | "s" | "b" | "c" | "de" {
        if (["SS"].includes(this.songCardData.accuracyToLetters))
            return "ss";

        if (["S"].includes(this.songCardData.accuracyToLetters))
            return "s";

        if (["A"].includes(this.songCardData.accuracyToLetters))
            return "a";

        if (["B"].includes(this.songCardData.accuracyToLetters))
            return "b";

        if (["C"].includes(this.songCardData.accuracyToLetters))
            return "c";

        if (["D", "E"].includes(this.songCardData.accuracyToLetters))
            return "de";

        return "de";
    }

    private timeToLetters(time: number): string {
            let minutes = Math.floor((time / 1000) / 60).toFixed(0);
            let seconds = ((time / 1000) % 60).toFixed(0);

            if (+(seconds) < 10) {
                seconds = "0" + seconds;
            }

            return minutes + ":" + seconds;
    }

    private timeToPercentage(): number {
        return Math.min(this.songCardData.time / this.songCardData.totalTime) * 100;
    }

    private hasLiveScoreSample(): boolean {
        return this.songCardData.score !== "0"
            || this.songCardData.combo > 0
            || this.songCardData.miss > 0;
    }

    private formatPp(value: number, decimals = 0): string {
        if (decimals <= 0)
            return Math.round(value) + "pp";

        const rounded = Math.round(value * (10 ** decimals)) / (10 ** decimals);
        return rounded.toFixed(decimals).replace(/\.0+$/, "") + "pp";
    }

    private formatDelta(value: number, decimals = 0): string {
        if (decimals <= 0) {
            const rounded = Math.round(value);
            const prefix = rounded > 0 ? "+" : rounded === 0 ? "=" : "";
            return prefix + rounded + "pp";
        }

        const factor = 10 ** decimals;
        const rounded = Math.round(value * factor) / factor;
        const prefix = rounded > 0 ? "+" : rounded === 0 ? "=" : "";
        return prefix + rounded.toFixed(decimals).replace(/\.0+$/, "") + "pp";
    }

    private clearPPState(clearMetadata = false): void {
        this._ssMapMaxPP = 0;
        this._blAccRating = 0;
        this._blPassRating = 0;
        this._blTechRating = 0;
        this._playerBestSSPP = 0;
        this._playerBestBLPP = 0;

        this.songCardData.ssPP = "";
        this.songCardData.blPP = "";
        this.songCardData.ssDelta = "";
        this.songCardData.blDelta = "";
        this.songCardData.mapPPDelta = "";

        if (clearMetadata) {
            this.songCardData.ranked = false;
            this.songCardData.qualified = false;
            this.songCardData.bsrKey = "";
        }
    }

    private async updateSongInfo(): Promise<void> {
        if (this.songCardData.disabled
            || !this.songCardData.needUpdate)
            return;

        this.songCardData.needUpdate = false;
        this.songCardData.totalTimeToLetters = this.timeToLetters(this.songCardData.totalTime);

        if (!this.songCardData.hashMap) {
            this.clearPPState(true);
            return;
        }

        const pid = PlayerCard.Instance.playerCardData.playerId;
        const normalizedCharacteristic = PPCalculator.normalizeCharacteristic(this.songCardData.characteristic);
        const diffNum = PPCalculator.toSSDifficultyNumber(this.songCardData.difficultyClass);
        const gameMode = PPCalculator.toSSGameMode(normalizedCharacteristic);
        const token = `${this.songCardData.hashMap}:${this.songCardData.difficultyClass}:${normalizedCharacteristic}:${pid}`;

        if (token !== this._mapToken) {
            this._mapToken = token;
            this.clearPPState(true);
        }

        const [bsResult, ssResult, blResult, scoreResult, blScoreResult] = await Promise.allSettled([
            this._beatSaver.getSongInfo(this.songCardData.hashMap),
            this._scoreSaber.getLeaderboardInfo(this.songCardData.hashMap, diffNum, gameMode),
            this._beatLeader.getLeaderboardInfo(this.songCardData.hashMap, this.songCardData.difficultyClass, normalizedCharacteristic),
            pid !== "0"
                ? this._scoreSaber.getPlayerScoreOnMap(this.songCardData.hashMap, diffNum, gameMode, pid)
                : Promise.resolve({ error: "no pid", pp: 0 } as Globals.I_scoreSaberPlayerScoreJSON),
            pid !== "0"
                ? this._beatLeader.getPlayerScoreOnMap(this.songCardData.hashMap, this.songCardData.difficultyClass, normalizedCharacteristic, pid)
                : Promise.resolve({ error: "no pid", pp: 0 } as Globals.I_beatLeaderPlayerScoreJSON)
        ]);

        if (this._mapToken !== token)
            return;

        this.clearPPState();

        if (bsResult.status === "fulfilled" && bsResult.value.error === undefined) {
            const data = bsResult.value;
            this.songCardData.cover = data.versions[0].coverURL;
            this.songCardData.ranked = data.ranked;
            this.songCardData.qualified = (data.ranked) ? false : data.qualified;
            this.songCardData.bsrKey = data.id;
        } else {
            this.songCardData.ranked = false;
            this.songCardData.qualified = false;
            this.songCardData.bsrKey = "NotFound";
        }

        if (ssResult.status === "fulfilled" && ssResult.value.error === undefined)
            this._ssMapMaxPP = ssResult.value.maxPP ?? 0;

        if (blResult.status === "fulfilled" && blResult.value.error === undefined) {
            this._blAccRating = blResult.value.accRating ?? 0;
            this._blPassRating = blResult.value.passRating ?? 0;
            this._blTechRating = blResult.value.techRating ?? 0;
        }

        if (scoreResult.status === "fulfilled" && scoreResult.value.error === undefined)
            this._playerBestSSPP = scoreResult.value.pp ?? 0;

        if (blScoreResult.status === "fulfilled" && blScoreResult.value.error === undefined)
            this._playerBestBLPP = blScoreResult.value.pp ?? 0;
    }

    /////////////////////
    // PUBLIC FUNCTION //
    /////////////////////
    public async loadSkin(skinName: string): Promise<void> {
        if (this.songCardData.disabled)
            return;

        if (skinName !== undefined)
            await this._template.loadSkin(Globals.E_MODULES.SONGCARD, skinName);
    }

    public refreshSongCard(): void {
        const currentPid = PlayerCard.Instance.playerCardData.playerId;
        if (currentPid !== this._lastPid) {
            this._lastPid = currentPid;
            this.songCardData.needUpdate = true;
        }

        this.updateSongInfo().then(() => {
            this.songCardData.accuracyToLetters = this.accuracyToLetter();
            this.songCardData.accuracyToLetterClass = this.accuracyToLetterClass();

            const acc01 = this.songCardData.accuracy / 100;
            const hasLiveScoreSample = this.hasLiveScoreSample();

            if (this.songCardData.started && !hasLiveScoreSample) {
                this.songCardData.ssPP = this._ssMapMaxPP > 0 ? this.formatPp(0, 2) : "";
                this.songCardData.blPP = (this._blAccRating + this._blPassRating + this._blTechRating) > 0 ? this.formatPp(0, 2) : "";

                if (this._playerBestSSPP > 0) {
                    this.songCardData.ssDelta = this.formatDelta(-this._playerBestSSPP, 2);
                    this.songCardData.mapPPDelta = this.songCardData.ssDelta;
                } else {
                    this.songCardData.ssDelta = "";
                    this.songCardData.mapPPDelta = "";
                }

                if (this._playerBestBLPP > 0)
                    this.songCardData.blDelta = this.formatDelta(-this._playerBestBLPP, 2);
                else
                    this.songCardData.blDelta = "";
            } else if (this.songCardData.started && this._ssMapMaxPP > 0) {
                const pp = PPCalculator.ssPP(acc01, this._ssMapMaxPP);
                this.songCardData.ssPP = this.formatPp(pp, 2);

                if (this._playerBestSSPP > 0) {
                    this.songCardData.ssDelta = this.formatDelta(pp - this._playerBestSSPP, 2);
                    this.songCardData.mapPPDelta = this.songCardData.ssDelta;
                } else {
                    this.songCardData.ssDelta = "NEW " + this.formatPp(pp, 2);
                    this.songCardData.mapPPDelta = this.songCardData.ssDelta;
                }
            } else {
                this.songCardData.ssPP = "";
                this.songCardData.ssDelta = "";
                this.songCardData.mapPPDelta = "";
            }

            if (this.songCardData.started && !hasLiveScoreSample) {
                // Handled by the initial-state block above to avoid 100%-accuracy fake PP before first note.
            } else if (this.songCardData.started && (this._blAccRating + this._blPassRating + this._blTechRating) > 0) {
                const pp = PPCalculator.beatLeaderPP(acc01, this._blAccRating, this._blPassRating, this._blTechRating);
                this.songCardData.blPP = this.formatPp(pp, 2);

                if (this._playerBestBLPP > 0)
                    this.songCardData.blDelta = this.formatDelta(pp - this._playerBestBLPP, 2);
                else
                    this.songCardData.blDelta = "NEW " + this.formatPp(pp, 2);
            } else {
                this.songCardData.blPP = "";
                this.songCardData.blDelta = "";
            }

            this._template.refreshUI(this.songCardData, Globals.E_MODULES.SONGCARD);
            this._template.moduleScale(Globals.E_MODULES.SONGCARD, this.songCardData.position, this.songCardData.scale);
            this._template.moduleCorners(Globals.E_MODULES.SONGCARD, this.songCardData.position);

            this._template.stopOrStart(this.songCardData.started, this.songCardData.paused);
            this._template.missDisplay(this.songCardData.displayMiss);

            /* Plugin details */
            if (this.songCardData.skin === "reselim")
                this._template.timerToCircleBar(this.songCardData.timeToPercentage);

            if (this.songCardData.skin === "dietah")
                this._template.missChanger(this.songCardData.miss);
        });
    }

    /////////////
    // GETTERS //
    /////////////
    public static get Instance(): SongCard {
        return this._instance || (this._instance = new this());
    }
}
