import spidev


def analog_read(spi, channel):
    r = spi.xfer2([0x06, channel << 6, 0])
    adc_out = ((r[1] & 0x0f) << 8) | r[2]
    return adc_out
