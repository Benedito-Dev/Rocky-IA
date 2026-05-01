from enum import Enum
from pydantic import BaseModel


class ControlAction(str, Enum):
    # Janelas
    CLOSE_ACTIVE_WINDOW    = "close_active_window"
    MINIMIZE_ACTIVE_WINDOW = "minimize_active_window"
    MINIMIZE_ALL_WINDOWS   = "minimize_all_windows"
    MAXIMIZE_ACTIVE_WINDOW = "maximize_active_window"

    # Apps
    OPEN_APP  = "open_app"   # params: {"app": "spotify"}
    CLOSE_APP = "close_app"  # params: {"app": "chrome"}

    # Sistema
    VOLUME_UP   = "volume_up"    # params: {"amount": 10} (opcional)
    VOLUME_DOWN = "volume_down"  # params: {"amount": 10} (opcional)
    MUTE_VOLUME = "mute_volume"
    SCREENSHOT  = "screenshot"   # params: {"save_path": "..."} (opcional)

    # Browser
    OPEN_URL = "open_url"  # params: {"url": "https://..."}


class ControlCommand(BaseModel):
    action: ControlAction
    params: dict = {}
    requires_confirmation: bool = False


class ControlResult(BaseModel):
    success: bool
    message: str   # mensagem que o Rocky verbaliza
    action: str
    params: dict = {}
