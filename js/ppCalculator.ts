export class PPCalculator {
    private static readonly SS_CURVE: [number, number][] = [
        [0.0, 0.0],
        [0.6, 0.18223233667439062],
        [0.65, 0.5866010012767576],
        [0.7, 0.6125565959114954],
        [0.75, 0.6451808210101443],
        [0.8, 0.6872268862950283],
        [0.825, 0.7150465663454271],
        [0.85, 0.7462290664143185],
        [0.875, 0.7816934560296046],
        [0.9, 0.825756123560842],
        [0.91, 0.8488375988124467],
        [0.92, 0.8728710341448851],
        [0.93, 0.9039994071865736],
        [0.94, 0.9417362980580238],
        [0.95, 1.0],
        [0.955, 1.0388633331418984],
        [0.96, 1.0871883573850478],
        [0.965, 1.1552120359501035],
        [0.97, 1.2485807759957321],
        [0.9725, 1.3090333065057616],
        [0.975, 1.3807102743105126],
        [0.9775, 1.4664726399289512],
        [0.98, 1.5702410055532239],
        [0.9825, 1.697536248647543],
        [0.985, 1.8563887693647105],
        [0.9875, 2.058947159052738],
        [0.99, 2.324506282149922],
        [0.99125, 2.4902905794106913],
        [0.9925, 2.685667856592722],
        [0.99375, 2.9190155639254955],
        [0.995, 3.2022017597337955],
        [0.99625, 3.5526145337555373],
        [0.9975, 3.996793606763322],
        [0.99825, 4.325027383589547],
        [0.999, 4.715470646416203],
        [0.9995, 5.019543595874787],
        [1.0, 5.367394282890631]
    ];

    // BeatLeader uses a steeper high-accuracy curve than ScoreSaber.
    private static readonly BL_ACC_CURVE: [number, number][] = [
        [0.0, 0.0],
        [0.6, 0.18223233667439062],
        [0.65, 0.5866010012767576],
        [0.7, 0.6125565959114954],
        [0.75, 0.6451808210101443],
        [0.8, 0.6872268862950283],
        [0.825, 0.7150465663454271],
        [0.85, 0.7462290664143185],
        [0.875, 0.7816934560296046],
        [0.9, 0.825756123560842],
        [0.91, 0.8488375988124467],
        [0.92, 0.8728710341448851],
        [0.93, 0.9039994071865736],
        [0.94, 0.9417362980580238],
        [0.95, 1.0],
        [0.955, 1.0388633331418984],
        [0.96, 1.0871883573850478],
        [0.965, 1.1552120359501035],
        [0.97, 1.2485807759957321],
        [0.9725, 1.3090333065057616],
        [0.975, 1.3807102743105126],
        [0.9775, 1.4664726399289512],
        [0.98, 1.5702410055532239],
        [0.9825, 1.697536248647543],
        [0.985, 1.8563887693647105],
        [0.9875, 2.058947159052738],
        [0.99, 2.324506282149922],
        [0.99125, 2.4902905794106913],
        [0.9925, 2.685667856592722],
        [0.99375, 2.9190155639254955],
        [0.995, 3.2022017597337955],
        [0.99625, 3.5526145337555373],
        [0.9975, 3.996793606763322],
        [0.99825, 4.325027383589547],
        [0.999, 4.715470646416203],
        [0.9995, 5.019543595874787],
        [1.0, 7.424]
    ];

    private static interpolate(acc: number, curve: [number, number][]): number {
        if (curve.length === 0)
            return 0;

        const clamped = Math.max(0, Math.min(1, acc));

        if (clamped <= curve[0][0])
            return curve[0][1];

        if (clamped >= curve[curve.length - 1][0])
            return curve[curve.length - 1][1];

        for (let i = 1; i < curve.length; i++) {
            const [x1, y1] = curve[i];
            const [x0, y0] = curve[i - 1];

            if (clamped <= x1) {
                const ratio = (clamped - x0) / (x1 - x0);
                return y0 + ((y1 - y0) * ratio);
            }
        }

        return curve[curve.length - 1][1];
    }

    public static ssMultiplier(acc: number): number {
        return this.interpolate(acc, this.SS_CURVE);
    }

    public static blAccMultiplier(acc: number): number {
        return this.interpolate(acc, this.BL_ACC_CURVE);
    }

    public static beatLeaderPP(acc: number, accRating: number, passRating: number, techRating: number): number {
        if (acc <= 0)
            return 0;

        const passPP = Math.max(0, 15.2 * Math.exp(passRating * -0.5) - 0.5);
        const accPP = this.blAccMultiplier(acc) * accRating * 34.0;
        const techPP = Math.exp(1.9 * acc) * 1.08 * techRating;
        const raw = passPP + accPP + techPP;

        return raw > 0 ? raw * (1.0 / (1.0 - 0.03 * Math.log(raw / 100.0))) : 0;
    }

    public static normalizeCharacteristic(characteristic: string): string {
        const normalized = (characteristic ?? "").trim();
        const map: {[key: string]: string} = {
            Standard: "Standard",
            SoloStandard: "Standard",
            OneSaber: "OneSaber",
            SoloOneSaber: "OneSaber",
            NoArrows: "NoArrows",
            SoloNoArrows: "NoArrows",
            SoloNoArrowsRandom: "NoArrows",
            "360Degree": "360Degree",
            Solo360Degree: "360Degree",
            "90Degree": "90Degree",
            Solo90Degree: "90Degree",
            Lightshow: "Lightshow",
            SoloLightshow: "Lightshow",
            Lawless: "Lawless",
            SoloLawless: "Lawless"
        };

        return map[normalized] ?? (normalized || "Standard");
    }

    public static toSSGameMode(characteristic: string): string {
        const normalized = this.normalizeCharacteristic(characteristic);
        const map: {[key: string]: string} = {
            Standard: "SoloStandard",
            OneSaber: "SoloOneSaber",
            NoArrows: "SoloNoArrowsRandom",
            "360Degree": "Solo360Degree",
            "90Degree": "Solo90Degree"
        };

        return map[normalized] ?? "SoloStandard";
    }

    public static toSSDifficultyNumber(difficultyClass: string): number {
        const map: {[key: string]: number} = {
            Easy: 1,
            Normal: 3,
            Hard: 5,
            Expert: 7,
            ExpertPlus: 9
        };

        return map[difficultyClass] ?? 9;
    }
}
