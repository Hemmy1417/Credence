# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
# Minimal probe — does this load in YOUR Studio? Tests: module-level helper fn,
# TreeMap[str,str], u256, a write returning str, json. Throwaway diagnostic file.
from genlayer import *
import json


def _helper(x: str):
    return x.strip().lower()


class CredenceTest(gl.Contract):
    items: TreeMap[str, str]
    counter: u256

    def __init__(self) -> None:
        self.items = TreeMap()
        self.counter = u256(0)

    @gl.public.write
    def add(self, key: str, value: str) -> str:
        k = _helper(key)
        self.items[k] = value
        self.counter = u256(int(self.counter) + 1)
        return json.dumps({"key": k, "count": int(self.counter)})

    @gl.public.view
    def get(self, key: str) -> str:
        return self.items.get(_helper(key), "")
