import asyncio
import argparse

from miraie_ac import MirAIeBroker, MirAIeHub
from miraie_ac.enums import HVACMode, FanMode, PresetMode, SwingMode, DisplayMode, ConvertiMode

async def setup(mobile, password, command, value=None):
    # Instantiate a MirAIeBroker object
    broker = MirAIeBroker()

    # Instantiate a MirAIeHub object
    hub = MirAIeHub()

    await hub.init(mobile, password, broker)

    # Wait till connection has been established with the broker
    async def waitForClient():
        while not hasattr(broker, "client") or getattr(broker, "client") is None:
            await asyncio.sleep(1)

    await waitForClient()

    if hub.home.devices:
        device = hub.home.devices[0]

        if command == "on":
            await device.turn_on()
            print("Turned on")
        elif command == "off":
            await device.turn_off()
            print("Turned off")
        elif command == "set_temperature":
            temp = float(value)
            await device.set_temperature(temp)
            print(f"Temperature set to {temp}")
        elif command == "set_hvac_mode":
            mode = HVACMode(value)
            await device.set_hvac_mode(mode)
            print(f"HVAC mode set to {mode}")
        elif command == "set_fan_mode":
            mode = FanMode(value)
            await device.set_fan_mode(mode)
            print(f"Fan mode set to {mode}")
        elif command == "set_preset_mode":
            mode = PresetMode(value)
            await device.set_preset_mode(mode)
            print(f"Preset mode set to {mode}")
        elif command == "set_v_swing":
            mode = SwingMode(int(value))
            await device.set_v_swing_mode(mode)
            print(f"Vertical swing set to {mode}")
        elif command == "set_h_swing":
            mode = SwingMode(int(value))
            await device.set_h_swing_mode(mode)
            print(f"Horizontal swing set to {mode}")
        elif command == "set_display":
            mode = DisplayMode(value)
            await device.set_display_mode(mode)
            print(f"Display mode set to {mode}")
        elif command == "set_converti":
            mode = ConvertiMode(int(value))
            await device.set_converti_mode(mode)
            print(f"Converti mode set to {mode}")
        else:
            print(f"Unknown command: {command}")
    else:
        print("No devices found")

    await asyncio.sleep(2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Control MirAIe AC")
    parser.add_argument("--mobile", required=True, help="Mobile number for login")
    parser.add_argument("--password", required=True, help="Password for login")
    parser.add_argument(
        "--command",
        required=True,
        choices=["on", "off", "set_temperature", "set_hvac_mode", "set_fan_mode",
                 "set_preset_mode", "set_v_swing", "set_h_swing", "set_display", "set_converti"],
        help="Command to execute",
    )
    parser.add_argument("--value", required=False, help="Value for the command (if applicable)")

    args = parser.parse_args()

    import sys
    if sys.platform == 'win32':
        asyncio.run(setup(args.mobile, args.password, args.command, args.value), loop_factory=asyncio.SelectorEventLoop)
    else:
        asyncio.run(setup(args.mobile, args.password, args.command, args.value))