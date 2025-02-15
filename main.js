const { SerialPort } = require('serialport');

const serial_port = new SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 38400,
});

/**
 * @template T
 * @interface Result
 * @property {T} ok
 * @property {any} err
 */

/**
 * 
 * @param {string} elm327_command 
 * @param {number} pool_freq_ms 
 * @param {number} timeout 
 * @returns {Promise<Result<number[]>>}
 */
async function nc_jdm_obd_elm327_command(elm327_command, pool_freq_ms = 10, timeout = 1000) {
    /** @type {number[]} */
    const buffer = [];
    let __resolve = null;
    let __iid = null;
    let __t = 0;

    function __pool() {
        let byte = serial_port.read(1);
        if (byte === null)
            return;
        byte = byte[0];
        buffer.push(byte);

        if (buffer[buffer.length - 1] === 0x3E && buffer[buffer.length - 2] === 0x0D && buffer[buffer.length - 3] === 0x0D) { // \r\r>
            clearInterval(__iid);
            __resolve({ ok: buffer });
        }

        __t += pool_freq_ms;
        if (__t >= timeout)
            __resolve({ err: 'ELM327 TIME_OUT' });
    }

    return new Promise((resolve, _reject) => {
        __resolve = resolve;
        serial_port.write(elm327_command, err => {
            if (err)
                resolve({ err });
            __iid = setInterval(__pool, pool_freq_ms);
        });
    });
}

async function elm327_task() {
    const elm327_command_list = ['ATZ\r', 'ATE0\r', 'ATH1\r', '2120 1\r', '2121 1\r', '2122 1\r', '2123 1\r'];
    for (let cmd of elm327_command_list) {
        const res = await nc_jdm_obd_elm327_command(cmd, 10, 200);
        if (res.err) {
            console.log(`ERROR: ${res.err}`);
            return;
        }

        const elm327_packet = res.ok.slice(0, -3); // remove delimiter
        const elm327_msg = elm327_packet.map(x => String.fromCharCode(x)).join('');

        // app logic
        console.log([cmd, elm327_msg]);
    }
}

async function async_sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function async_loop() {
    while (1) {
        await elm327_task();
        await async_sleep(1000);
    }
}

async_loop().then(() => console.log('DONE')) // DONE will not be printed
