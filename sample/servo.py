import RPi.GPIO as GPIO
import time

FREQ = 20.0
MIN_PULSE = 0.5
MAX_PULSE = 2.4


def get_dc(ang):
    return angle_to_pulse(ang) / FREQ * 100


def angle_to_pulse(angle):
    angle = correction_angle(angle)
    return (MAX_PULSE - MIN_PULSE) * angle / 180 + MIN_PULSE


def correction_angle(angle):
    if angle < 0.0:
        angle = 0.0
    if angle > 180.0:
        angle = 180.0
    return angle


GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.OUT)
pwm = GPIO.PWM(18, 50)
pwm.start(get_dc(90))

'''
try:
    while True:
        for angle in range(0, 180, 1):
            pwm.ChangeDutyCycle(get_dc(angle))
            # print('angle = ' + str(angle) + ' dc = ' + str(get_dc(angle)))
            time.sleep(FREQ/1000)

        for angle in range(180, 0, -1):
            pwm.ChangeDutyCycle(get_dc(angle))
            # print('angle = ' + str(angle) + ' dc = ' + str(get_dc(angle)))
            time.sleep(FREQ/1000)
except:
    print("end")
    GPIO.cleanup()
'''

POS_DEFAULT = 90
POS_OPEN = 140

pwm.ChangeDutyCycle(get_dc(POS_OPEN))
time.sleep(1)
pwm.ChangeDutyCycle(get_dc(POS_DEFAULT))
time.sleep(1)
GPIO.cleanup()
