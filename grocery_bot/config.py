from grocery_bot.liste import Item, ItemKind

SAVE_PATH = "data"

DEFAULT_LIST = [
    Item(name="", quantity=0, units="", default=True, kind=ItemKind.AUTRE),
]
