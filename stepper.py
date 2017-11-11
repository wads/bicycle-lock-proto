import RPi.GPIO as GPIO
import time
import argparse

# argument parser
ap = argparse.ArgumentParser()
ap.add_argument("-d", "--direction", required=True, help="direction")
ap.add_argument("-s", "--step", required=True, help="step num")
args = vars(ap.parse_args())


GPIO.setmode(GPIO.BCM)

coil_A_1_pin = 14
coil_A_2_pin = 15
coil_B_1_pin = 17
coil_B_2_pin = 18

GPIO.setup(coil_A_1_pin, GPIO.OUT)
GPIO.setup(coil_A_2_pin, GPIO.OUT)
GPIO.setup(coil_B_1_pin, GPIO.OUT)
GPIO.setup(coil_B_2_pin, GPIO.OUT)

forward_seq = ['1010', '0110', '0101', '1001']
reverse_seq = list(forward_seq)
reverse_seq.reverse()


def forward(delay, steps):
    for i in range(steps):
        for step in forward_seq:
            set_step(step)
            time.sleep(delay)


def backwards(delay, steps):
    for i in range(steps):
        for step in reverse_seq:
            set_step(step)
            time.sleep(delay)


def set_step(step):
    GPIO.output(coil_A_1_pin, step[0] == '1')
    GPIO.output(coil_A_2_pin, step[1] == '1')
    GPIO.output(coil_B_1_pin, step[2] == '1')
    GPIO.output(coil_B_2_pin, step[3] == '1')


try:
    set_step('0000')
    delay = 10
    steps = args["step"]
    if args["direction"] == 'l':
        forward(int(delay) / 1000.0, int(steps))
    else:
        backwards(int(delay) / 1000.0, int(steps))
    GPIO.cleanup()
except Exception as e:
    GPIO.cleanup()
