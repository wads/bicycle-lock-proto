import RPi.GPIO as GPIO
import spidev
import time
import buzzer
import accelerometer

BUZZER_PIN = 18

BUZZER_PITCH = 100
BUZZER_DURATION = 0.1

SENSING_TERM = 0.5
ALARM_THRESHOLD = 45

GPIO.setmode(GPIO.BCM)


def is_lean_object(degx, degy):
    if abs(degx) > ALARM_THRESHOLD or abs(degy) > ALARM_THRESHOLD:
        return True
    return False


try:
    # init buzzer
    GPIO.setup(BUZZER_PIN, GPIO.OUT)
    GPIO.output(BUZZER_PIN, False)
    print("buzzer ready.")

    # init accelerometer
    spi = spidev.SpiDev()
    spi.open(0, 0)
    accelerometer_offset = accelerometer.offset_avg(spi)  # error adjustment
    print("accelerometer readay.")

    print("start proto.")
    while True:
        degx = accelerometer.degree_x(spi)
        degy = accelerometer.degree_y(spi)
        if is_lean_object(degx, degy):
            buzzer.buzz(BUZZER_PIN, BUZZER_PITCH, BUZZER_DURATION)
            print("buzz: %d, %d" % (degx, degy))
        else:
            buzzer.stop(BUZZER_PIN)
        time.sleep(SENSING_TERM)
except Exception as e:
    buzzer.stop(BUZZER_PIN)
    GPIO.cleanup()
    print("end")
