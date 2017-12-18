'''
Photoreflector sample using ADC MCP3204 model.
Operation checked with TDR-105F and LBR127HLD

Circuit diagram:
'''
import spidev
import time

CH = 0

def analog_read(channel):
    r = spi.xfer2([0x06, channel << 6, 0])
    adc_out = ((r[1] & 0x0f) << 8) | r[2]
    return adc_out


try:
    spi = spidev.SpiDev()
    spi.open(0, 0)

    while True:
        val = analog_read(CH)
        print(val)
        time.sleep(1)
except Exception as e:
    print "%s end\n" % e.args
