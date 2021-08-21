import os
import operator
from typing import Optional, Dict, Set
from enum import Enum

from pydantic import BaseModel, Field, PrivateAttr
import yaml
from loguru import logger


class ItemKind(Enum):
    PDT_ENTRETIEN = 1
    FRUIT_LEGUME = 2
    PDT_SEC_ESSENTIEL = 3
    PDT_ASIATIQUE = 4
    VIANDE_POISSON = 5
    PDT_TRANSFORME = 6
    PDT_LAITIER = 7
    OEUF = 8
    PDT_SURGELE = 9
    APERO = 10
    BOISSON = 11
    PDT_HYGIENE = 12
    AUTRE = 13

    @staticmethod
    def list():
        return list(sorted(ItemKind))

    def __lt__(self, other):
        return self.value < other.value

    def get_label(self):
        if self == ItemKind.PDT_ENTRETIEN:
            return "Produit d'entretien"
        elif self == ItemKind.FRUIT_LEGUME:
            return "Fruit et Légume"
        elif self == ItemKind.PDT_SEC_ESSENTIEL:
            return "Produit sec et essentiel"
        elif self == ItemKind.PDT_ASIATIQUE:
            return "Produit Asiatique"
        elif self == ItemKind.VIANDE_POISSON:
            return "Viande et Poisson"
        elif self == ItemKind.PDT_TRANSFORME:
            return "Produit transformé"
        elif self == ItemKind.PDT_LAITIER:
            return "Produit laitier"
        elif self == ItemKind.OEUF:
            return "Oeuf"
        elif self == ItemKind.PDT_SURGELE:
            return "Produit Surgelé"
        elif self == ItemKind.APERO:
            return "Apéro"
        elif self == ItemKind.BOISSON:
            return "Boisson"
        elif self == ItemKind.PDT_HYGIENE:
            return "Produit d'hygiène"
        elif self == ItemKind.AUTRE:
            return "Autre"

    @staticmethod
    def get_listing():
        return [
            {"name": i.name, "label": i.get_label(), "value": i.value}
            for i in ItemKind.list()
        ]


class Item(BaseModel):
    name: str
    quantity: int = Field(default=0, gt=-1)
    units: str = ""
    is_bought: bool = False
    kind: ItemKind = ItemKind.AUTRE

    def str_quantity(self):
        return f"{self.quantity} {self.units}".strip()

    def __str__(self):
        return f"{self.name:<30}{self.str_quantity():<10}{self.kind:<20}"

    def __eq__(self, other):
        return self.name == other.name

    def __hash__(self):
        return id(self.name)

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        d["kind"] = d["kind"].value
        return d


class GroceryList(BaseModel):
    name: str
    items: Dict = {}
    save_path: str = ""
    _items_names: Set[str] = PrivateAttr(default_factory=lambda: set())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.save("data")

    def add(self, item: Item):
        if item.name in self._items_names:
            self.update(item)
        else:
            self.items[hash(item.name)] = item
            self._items_names.add(item.name)

    def delete(self, item: Item):
        if not item.name in self._items_names:
            raise ValueError(
                f"Could not delete item {item.name} becuase it is not in grocery list"
            )
        self.items.pop(hash(item.name))

    def update(self, item: Item):
        if not item.name in self._items_names:
            raise ValueError(
                f"Could not update item {item.name} becuase it is not in grocery list "
            )
        self.items[hash(item.name)] = item

    def get_list(self):
        liste = {}
        for it in self._iterate_items():
            if it.kind.name not in liste:
                liste[it.kind.name] = [it]
            else:
                liste[it.kind.name].append(it)
        return liste

    def _iterate_items(self):
        for it in self.items.values():
            yield it

    def __str__(self):
        s = f"{self.name.capitalize():-^60}\n"
        return s + "\n".join([str(i) for i in self.get_list()])

    def clear(self):
        if not self.save_path:
            logger.info("Nothing to clear")
        os.remove(self.save_path)

    def save(self, path):
        if not self.save_path:
            self.save_path = os.path.join(
                path, f"{self.name.lower().replace(' ','_')}.yaml"
            )
        logger.info(f"saving to {self.save_path}")
        with open(self.save_path, "w") as f:
            yaml.dump(self.dict(), f, sort_keys=True, indent=4, allow_unicode=True)

    @staticmethod
    def load(path):
        logger.info(f"loading list {path}")
        with open(path, "r") as f:
            dic = yaml.safe_load(f)
        g = GroceryList(name=dic["name"], save_path=dic["save_path"])
        g._items_names = set()
        kinds = ItemKind.list()
        for k, v in dic["items"].items():
            g.add(
                Item(
                    name=v["name"],
                    quantity=v["quantity"],
                    units=v["units"],
                    kind=kinds[v["kind"] - 1],
                )
            )
        return g


if __name__ == "__main__":
    i = Item(name="banane", quantity=5)
    print(i.kind)

    l = GroceryList()
    l.add(Item(name="banane", quantity=5, kind=ItemKind.FRUIT_LEGUME))
    l.add(Item(name="amande", quantity=5, kind=ItemKind.FRUIT_LEGUME))
    l.add(Item(name="table", quantity=1, kind=ItemKind.AUTRE))
    l.add(
        Item(name="pates", quantity=2, unit="packet", kind=ItemKind.PDT_SEC_ESSENTIEL)
    )
    print(l)

    l.update(Item(name="banane", quantity=2, kind=ItemKind.FRUIT_LEGUME))
    l.delete(Item(name="table", quantity=2, kind=ItemKind.FRUIT_LEGUME))
    print(l)

    l.save("data")
    print(Item(name="table", quantity=2, kind=ItemKind.FRUIT_LEGUME).dict())

    l2 = GroceryList.load("data\default.yaml")
    print(l2)
    assert l == l2
