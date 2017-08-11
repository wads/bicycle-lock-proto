import spidev, time

spi = spidev.SpiDev()
spi.open(0, 0)

def analog_read(channel):
    r = spi.xfer2([0x06, channel << 6, 0])
    adc_out = ((r[1]&3) << 8) + r[2]
    return adc_out


try:
    while True:
        x = analog_read(0)
        y = analog_read(1)
        z = analog_read(2)
        print ("x=%d, y=%d, z=%d" % (x, y, z))
        time.sleep(1)
except:
    print "end\n"
