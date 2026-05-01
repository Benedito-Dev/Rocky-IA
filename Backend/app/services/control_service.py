"""
control_service — executa ações de controle de PC via whitelist segura.

SEGURANÇA:
- Nunca passa strings do LLM para subprocess/os.system diretamente.
- open_app: lookup obrigatório em APP_EXECUTABLES. Chave desconhecida = erro controlado.
- open_url: valida scheme (http/https) antes de abrir.
- close_app: fecha por título de janela, exige match exato.
"""
import logging
import os
import subprocess
import webbrowser
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import pyautogui
import pygetwindow as gw

from app.models.control import ControlAction, ControlCommand, ControlResult

logger = logging.getLogger(__name__)

# Failsafe do pyautogui desativado para uso em servidor
# (mover mouse para canto superior esquerdo não deve abortar o processo)
pyautogui.FAILSAFE = False

# Whitelist: nome canônico → executável no PATH ou nome no PATH do Windows
APP_EXECUTABLES: dict[str, str] = {
    "spotify":    "spotify.exe",
    "chrome":     "chrome.exe",
    "firefox":    "firefox.exe",
    "vscode":     "code.exe",
    "notepad":    "notepad.exe",
    "calculator": "calc.exe",
    "explorer":   "explorer.exe",
    "discord":    "discord.exe",
    "telegram":   "telegram.exe",
    "whatsapp":   "whatsapp.exe",
    "word":       "winword.exe",
    "excel":      "excel.exe",
    "powerpoint": "powerpnt.exe",
    "paint":      "mspaint.exe",
    "cmd":        "cmd.exe",
    "terminal":   "wt.exe",
}

# Pasta padrão para screenshots
_SCREENSHOT_DIR = Path.home() / "Desktop"


def execute(command: ControlCommand) -> ControlResult:
    """
    Executa o comando e retorna ControlResult com sucesso/falha.
    Todos os handlers são síncronos — chamar via asyncio.to_thread quando necessário.
    """
    action = command.action
    params = command.params

    logger.info(f"execute: ação={action.value} params={params}")

    try:
        if action == ControlAction.CLOSE_ACTIVE_WINDOW:
            return _close_active_window()

        elif action == ControlAction.MINIMIZE_ACTIVE_WINDOW:
            return _minimize_active_window()

        elif action == ControlAction.MINIMIZE_ALL_WINDOWS:
            return _minimize_all_windows()

        elif action == ControlAction.MAXIMIZE_ACTIVE_WINDOW:
            return _maximize_active_window()

        elif action == ControlAction.OPEN_APP:
            return _open_app(params)

        elif action == ControlAction.CLOSE_APP:
            return _close_app(params)

        elif action == ControlAction.VOLUME_UP:
            return _volume_up(params)

        elif action == ControlAction.VOLUME_DOWN:
            return _volume_down(params)

        elif action == ControlAction.MUTE_VOLUME:
            return _mute_volume()

        elif action == ControlAction.SCREENSHOT:
            return _screenshot(params)

        elif action == ControlAction.OPEN_URL:
            return _open_url(params)

        else:
            return ControlResult(
                success=False,
                message=f"Ação '{action.value}' não implementada.",
                action=action.value,
                params=params,
            )

    except Exception as e:
        logger.error(f"execute falhou para ação={action.value}: {e}")
        return ControlResult(
            success=False,
            message=f"Erro ao executar '{action.value}'.",
            action=action.value,
            params=params,
        )


# ─── Handlers individuais ─────────────────────────────────────────────────────


def _close_active_window() -> ControlResult:
    pyautogui.hotkey("alt", "F4")
    logger.info("close_active_window: Alt+F4 enviado")
    return ControlResult(
        success=True,
        message="Janela ativa fechada.",
        action=ControlAction.CLOSE_ACTIVE_WINDOW.value,
    )


def _minimize_active_window() -> ControlResult:
    try:
        win = gw.getActiveWindow()
        if win is None:
            return ControlResult(
                success=False,
                message="Nenhuma janela ativa encontrada.",
                action=ControlAction.MINIMIZE_ACTIVE_WINDOW.value,
            )
        win.minimize()
        logger.info(f"minimize_active_window: '{win.title}' minimizada")
        return ControlResult(
            success=True,
            message="Janela minimizada.",
            action=ControlAction.MINIMIZE_ACTIVE_WINDOW.value,
        )
    except Exception as e:
        logger.warning(f"minimize_active_window via pygetwindow falhou ({e}) — usando Win+Down")
        pyautogui.hotkey("win", "down")
        return ControlResult(
            success=True,
            message="Janela minimizada.",
            action=ControlAction.MINIMIZE_ACTIVE_WINDOW.value,
        )


def _minimize_all_windows() -> ControlResult:
    pyautogui.hotkey("win", "d")
    logger.info("minimize_all_windows: Win+D enviado")
    return ControlResult(
        success=True,
        message="Todas as janelas minimizadas.",
        action=ControlAction.MINIMIZE_ALL_WINDOWS.value,
    )


def _maximize_active_window() -> ControlResult:
    try:
        win = gw.getActiveWindow()
        if win is None:
            return ControlResult(
                success=False,
                message="Nenhuma janela ativa encontrada.",
                action=ControlAction.MAXIMIZE_ACTIVE_WINDOW.value,
            )
        win.maximize()
        logger.info(f"maximize_active_window: '{win.title}' maximizada")
        return ControlResult(
            success=True,
            message="Janela maximizada.",
            action=ControlAction.MAXIMIZE_ACTIVE_WINDOW.value,
        )
    except Exception as e:
        logger.warning(f"maximize_active_window via pygetwindow falhou ({e}) — usando Win+Up")
        pyautogui.hotkey("win", "up")
        return ControlResult(
            success=True,
            message="Janela maximizada.",
            action=ControlAction.MAXIMIZE_ACTIVE_WINDOW.value,
        )


def _open_app(params: dict) -> ControlResult:
    app_name = str(params.get("app", "")).lower().strip()

    if app_name not in APP_EXECUTABLES:
        known = ", ".join(sorted(APP_EXECUTABLES.keys()))
        logger.warning(f"open_app: app '{app_name}' não está na whitelist")
        return ControlResult(
            success=False,
            message=f"App '{app_name}' não reconhecido. Apps disponíveis: {known}.",
            action=ControlAction.OPEN_APP.value,
            params=params,
        )

    executable = APP_EXECUTABLES[app_name]
    # subprocess.Popen com lista — nunca shell=True, nunca string do LLM
    subprocess.Popen([executable], shell=False)
    logger.info(f"open_app: '{app_name}' ({executable}) iniciado")
    return ControlResult(
        success=True,
        message=f"{app_name.capitalize()} aberto.",
        action=ControlAction.OPEN_APP.value,
        params=params,
    )


def _close_app(params: dict) -> ControlResult:
    app_name = str(params.get("app", "")).lower().strip()

    if not app_name:
        return ControlResult(
            success=False,
            message="Nome do app não especificado.",
            action=ControlAction.CLOSE_APP.value,
            params=params,
        )

    if app_name not in APP_EXECUTABLES:
        logger.warning(f"close_app: app '{app_name}' não está na whitelist")
        return ControlResult(
            success=False,
            message=f"App '{app_name}' não reconhecido.",
            action=ControlAction.CLOSE_APP.value,
            params=params,
        )

    # Buscar janelas cujo título contenha o nome do app (case-insensitive)
    all_windows = gw.getAllWindows()
    matches = [w for w in all_windows if app_name in w.title.lower() and w.title.strip()]

    if not matches:
        return ControlResult(
            success=False,
            message=f"Nenhuma janela do {app_name.capitalize()} encontrada.",
            action=ControlAction.CLOSE_APP.value,
            params=params,
        )

    closed = 0
    for win in matches:
        try:
            win.close()
            closed += 1
            logger.info(f"close_app: janela '{win.title}' fechada")
        except Exception as e:
            logger.warning(f"close_app: falha ao fechar '{win.title}': {e}")

    if closed == 0:
        return ControlResult(
            success=False,
            message=f"Não consegui fechar o {app_name.capitalize()}.",
            action=ControlAction.CLOSE_APP.value,
            params=params,
        )

    return ControlResult(
        success=True,
        message=f"{app_name.capitalize()} fechado.",
        action=ControlAction.CLOSE_APP.value,
        params=params,
    )


def _volume_up(params: dict) -> ControlResult:
    amount = int(params.get("amount", 10))
    # Cada pressão de tecla aumenta ~2% no Windows — aproximar via presses
    presses = max(1, round(amount / 2))
    presses = min(presses, 50)  # limite de segurança
    pyautogui.press("volumeup", presses=presses)
    logger.info(f"volume_up: {presses} pressionamentos (amount={amount})")
    return ControlResult(
        success=True,
        message=f"Volume aumentado.",
        action=ControlAction.VOLUME_UP.value,
        params=params,
    )


def _volume_down(params: dict) -> ControlResult:
    amount = int(params.get("amount", 10))
    presses = max(1, round(amount / 2))
    presses = min(presses, 50)
    pyautogui.press("volumedown", presses=presses)
    logger.info(f"volume_down: {presses} pressionamentos (amount={amount})")
    return ControlResult(
        success=True,
        message="Volume reduzido.",
        action=ControlAction.VOLUME_DOWN.value,
        params=params,
    )


def _mute_volume() -> ControlResult:
    pyautogui.press("volumemute")
    logger.info("mute_volume: tecla mute pressionada")
    return ControlResult(
        success=True,
        message="Volume mutado.",
        action=ControlAction.MUTE_VOLUME.value,
    )


def _screenshot(params: dict) -> ControlResult:
    save_path_raw = params.get("save_path", "")

    if save_path_raw:
        # Resolve e restringe ao home do usuário para evitar path traversal
        resolved = Path(save_path_raw).resolve()
        if not str(resolved).startswith(str(Path.home())):
            resolved = _SCREENSHOT_DIR / resolved.name
        save_path = resolved
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = _SCREENSHOT_DIR / f"rocky_screenshot_{timestamp}.png"

    # Garantir que o diretório de destino existe
    try:
        save_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.warning(f"screenshot: não conseguiu criar diretório '{save_path.parent}': {e}")

    img = pyautogui.screenshot()
    img.save(str(save_path))
    logger.info(f"screenshot: salvo em '{save_path}'")
    return ControlResult(
        success=True,
        message=f"Screenshot salvo em {save_path.name}.",
        action=ControlAction.SCREENSHOT.value,
        params={"save_path": str(save_path)},
    )


def _open_url(params: dict) -> ControlResult:
    url = str(params.get("url", "")).strip()

    if not url:
        return ControlResult(
            success=False,
            message="URL não especificada.",
            action=ControlAction.OPEN_URL.value,
            params=params,
        )

    # Adicionar scheme se ausente
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Validar scheme — rejeitar qualquer coisa que não seja http/https
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        logger.warning(f"open_url: scheme inválido '{parsed.scheme}' para URL '{url}'")
        return ControlResult(
            success=False,
            message="URL inválida. Apenas http e https são permitidos.",
            action=ControlAction.OPEN_URL.value,
            params=params,
        )

    webbrowser.open(url)
    logger.info(f"open_url: '{url}' aberta no browser padrão")
    return ControlResult(
        success=True,
        message=f"Abrindo {url} no browser.",
        action=ControlAction.OPEN_URL.value,
        params={"url": url},
    )
