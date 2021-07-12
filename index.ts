import { GameOptions } from "@skeldjs/protocol";
import dgram from "dgram";

import {
    EventListener,
    HindenburgPlugin,
    Plugin,
    Worker,
    WorkerBeforeJoinEvent
} from "@skeldjs/hindenburg";

@HindenburgPlugin({
    id: "hbplugin-lan-broadcast",
    version: "1.0.0",
    order: "none"
})
export default class extends Plugin {
    lanBroadcaster: dgram.Socket;
    interval: NodeJS.Timeout;

    constructor(
        public readonly worker: Worker,
        public readonly config: any
    ) {
        super(worker, config);

        this.lanBroadcaster = dgram.createSocket("udp4");

        const buf = Buffer.from([
            0x04,
            0x02,
            ...Buffer.from("<size=150%><voffset=-1em>Hindenburg~Open~<color=#80cc06>Join Local</color>)<alpha=#00></voffset>\n~", "utf8")
        ]);

        this.lanBroadcaster.bind(() => {
            this.lanBroadcaster.setBroadcast(true);
        });

        this.interval = setInterval(() => {
            this.lanBroadcaster.send(buf, 47777, "255.255.255.255"); // broadcast ip
        }, 50);
    }

    async onPluginUnload() {
        this.lanBroadcaster.close();
        clearInterval(this.interval);
    }

    @EventListener("worker.beforejoin")
    async onWorkerBeforeJoin(ev: WorkerBeforeJoinEvent) {
        if (ev.gameCode === 0x20) {
            if (!this.worker.rooms.has(0x20)) {
                const localRoom = await this.worker.createRoom(0x20, new GameOptions);
                ev.setRoom(localRoom);
            }
        }
    }
}