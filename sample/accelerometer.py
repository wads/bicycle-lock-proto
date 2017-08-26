import spidev
import time

POWER_SUPPLY_VOLTAGE = 4.00  # [V]
AMPLITUDE_PER_G = POWER_SUPPLY_VOLTAGE / 5 * 1000  # [mV]
OFFSET_V = POWER_SUPPLY_VOLTAGE / 2 * 1000  # [mV]
MV_PER_DEG = AMPLITUDE_PER_G / 90

CH_X = 0
CH_Y = 1
CH_Z = 2

def analog_read(channel):
    r = spi.xfer2([0x06, channel << 6, 0])
    adc_out = ((r[1] & 0x0f) << 8) | r[2]
    return adc_out


def degree(channel, offset):
    value = analog_read(channel)
    return (value - offset) / MV_PER_DEG


def offset_avg(roop_cnt=100):
    avg = [0, 0, 0]  # x, y, z
    for i in range(0, roop_cnt):
        avg[0] += analog_read(CH_X)
        avg[1] += analog_read(CH_Y)
        avg[2] += analog_read(CH_Z)
    return [i/roop_cnt for i in avg]


spi = spidev.SpiDev()
spi.open(0, 0)

offset = offset_avg()

try:
    while True:
        print(
            "x=%d, y=%d, z=%d" %
            (degree(CH_X, offset[CH_X]), degree(CH_Y, offset[CH_Y]),
             degree(CH_Z, offset[CH_Z])))
        time.sleep(1)
except Exception as e:
    print "%s end\n" % e.args
