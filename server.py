import threading
import logging
import assemblyai as aai
from fastapi import FastAPI, WebSocket
from assemblyai.streaming.v3 import (
    BeginEvent,
    StreamingClient,
    StreamingClientOptions,
    StreamingError,
    StreamingEvents,
    StreamingParameters,
    StreamingSessionParameters,
    TerminationEvent,
    TurnEvent,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔥 Hardcoded API key (per your request)
API_KEY = "8bda2c5f253c46c8afc2188d3b2dec2e"

app = FastAPI()

def build_client(on_turn):
    client = StreamingClient(
        StreamingClientOptions(
            api_key=API_KEY,
            api_host="streaming.assemblyai.com",
        )
    )

    def on_begin(self: StreamingClient, event: BeginEvent):
        logger.info(f"Session started: {event.id}")

    def on_terminated(self: StreamingClient, event: TerminationEvent):
        logger.info(f"Session terminated: {event.audio_duration_seconds}s processed")

    def on_error(self: StreamingClient, error: StreamingError):
        logger.error(f"Error occurred: {error}")

    client.on(StreamingEvents.Begin, on_begin)
    client.on(StreamingEvents.Turn, on_turn)
    client.on(StreamingEvents.Termination, on_terminated)
    client.on(StreamingEvents.Error, on_error)

    return client

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()

    def on_turn(self: StreamingClient, event: TurnEvent):
        import json
        try:
            ws.send_text(json.dumps({
                "transcript": event.transcript,
                "end_of_turn": event.end_of_turn,
            }))
        except Exception as e:
            logger.exception(e)

        if event.end_of_turn and not event.turn_is_formatted:
            params = StreamingSessionParameters(format_turns=True)
            self.set_params(params)

    client = build_client(on_turn)
    client.connect(StreamingParameters(sample_rate=16000, format_turns=True))

    mic = aai.extras.MicrophoneStream(sample_rate=16000)
    t = threading.Thread(target=lambda: client.stream(mic), daemon=True)
    t.start()

    try:
        # Keep alive while the client is connected
        while t.is_alive():
            await ws.receive_text()
    except Exception:
        pass
    finally:
        client.disconnect(terminate=True)
        try:
            await ws.close()
        except Exception:
            pass
