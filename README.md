# NodeJS Serial Port non Blocking Sequential Requests
NodeJS serial port non blocking sequential Request/Response implementation.  
Based on [Node SerialPort NPM Package](https://serialport.io/).

## API Reference
```js
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
async function nc_jdm_obd_elm327_command(elm327_command, pool_freq_ms = 10, timeout = 1000);
```

## Example
```js
async function elm327_task() {
    const elm327_command_list = ['ATZ\r', 'ATE0\r', 'ATH1\r', '2120 1\r', '2121 1\r', '2122 1\r', '2123 1\r'];
    for (let cmd of elm327_command_list) {
        const res = await nc_jdm_obd_elm327_command(cmd);
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
```
