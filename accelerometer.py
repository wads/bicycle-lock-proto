import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

out_x_pin = 2
out_y_pin = 3
out_z_pin = 4

GPIO.setup(out_x_pin, GPIO.IN)
GPIO.setup(out_y_pin, GPIO.IN)
GPIO.setup(out_z_pin, GPIO.IN)


try:
    while True:
        print(GPIO.input(out_x_pin))
        print(GPIO.input(out_y_pin))
        print(GPIO.input(out_z_pin))

        #x = GPIO.input(out_x_pin)
        #y = GPIO.input(out_y_pin)
        #z = GPIO.input(out_z_pin)
        #print('x=%d, y=%d, z=%d' % (x, y, z))
        time.sleep(1)
except:
    GPIO.cleanup()
