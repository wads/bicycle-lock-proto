import spidev
import time

POWER_SUPPLY_VOLTAGE = 4.00  # [V]
AMPLITUDE_PER_G = POWER_SUPPLY_VOLTAGE / 5 * 1000  # [mV]
OFFSET_V = POWER_SUPPLY_VOLTAGE / 2 * 1000  # [mV]
MV_PER_DEG = AMPLITUDE_PER_G / 90

CH_X = 0
CH_Y = 1
CH_Z = 2


def offset_avg(spi, roop_cnt=100):
    avg = [0, 0, 0]  # x, y, z
    for i in range(0, roop_cnt):
        avg[0] += analog_read(spi, CH_X)
        avg[1] += analog_read(spi, CH_Y)
        avg[2] += analog_read(spi, CH_Z)
    return [i/roop_cnt for i in avg]


def analog_read(spi, channel):
    r = spi.xfer2([0x06, channel << 6, 0])
    adc_out = ((r[1] & 0x0f) << 8) | r[2]
    return adc_out


def analog_read_x(spi):
    return analog_read(spi, CH_X)


def analog_read_y(spi):
    return analog_read(spi, CH_Y)


def analog_read_x(spi):
    return analog_read(spi, CH_Z)


def degree(spi, channel, offset):
    value = analog_read(spi, channel)
    return (value - offset) / MV_PER_DEG


def degree_x(spi):
    return degree(spi, CH_X, offset=OFFSET_V)


def degree_y(spi):
    return degree(spi, CH_Y, offset=OFFSET_V)


def degree_z(spi):
    return degree(spi, CH_X, offset=OFFSET_V)
