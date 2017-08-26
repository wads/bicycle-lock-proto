import RPi.GPIO as GPIO
import time


def buzz(pin, pitch, duration):
    period = 1.0 / pitch
    delay = period / 2
    cycles = int(pitch * duration)
    for i in range(cycles):
        GPIO.output(pin, True)
        time.sleep(delay)
        GPIO.output(pin, False)
        time.sleep(delay)


def stop(pin):
    GPIO.output(pin, False)
