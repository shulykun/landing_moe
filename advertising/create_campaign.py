#!/usr/bin/env python3
"""
Создание рекламной кампании Яндекс Директ из CSV.
Climate Hall — Владивосток

Использование:
    export YANDEX_DIRECT_TOKEN="ваш_OAuth_токен"
    export YANDEX_DIRECT_CLIENT_LOGIN="ваш_логин_директа"

    # Проверка без реального создания:
    python3 advertising/create_campaign.py --dry-run

    # Создание кампании:
    python3 advertising/create_campaign.py
"""

import csv
import json
import os
import sys
import argparse
from datetime import date
from collections import OrderedDict

try:
    import requests
except ImportError:
    sys.exit("Нужен requests: pip3 install requests")

# ─── Настройки ────────────────────────────────────────────────────────────────

TOKEN = os.environ.get("YANDEX_DIRECT_TOKEN", "")
CLIENT_LOGIN = os.environ.get("YANDEX_DIRECT_CLIENT_LOGIN", "")
API_BASE = "https://api.direct.yandex.com/json/v5/"

# Гео-ID Владивостока
# https://yandex.ru/support/direct/regions.html
VLADIVOSTOK_GEO = 11119

# Ставка 10 ₽ в единицах API (валюта × 1 000 000)
DEFAULT_BID = 10_000_000

CAMPAIGN_NAME = "Climate Hall — Владивосток"

CSV_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "climate-hall-vladivostok.csv",
)


# ─── API-клиент ───────────────────────────────────────────────────────────────

def api(service, method, params):
    """Вызов метода API Яндекс Директа v5."""
    if not TOKEN or not CLIENT_LOGIN:
        sys.exit("❌ Задайте YANDEX_DIRECT_TOKEN и YANDEX_DIRECT_CLIENT_LOGIN")

    url = API_BASE + service
    headers = {
        "Authorization": "Bearer " + TOKEN,
        "Client-Login": CLIENT_LOGIN,
        "Accept-Language": "ru",
        "Content-Type": "application/json; charset=utf-8",
    }
    body = {"method": method, "params": params}

    print("  → {}.{}".format(service, method), end=" ", flush=True)
    resp = requests.post(url, headers=headers, json=body)
    result = resp.json()

    # Ошибка запроса целиком
    if "error" in result:
        err = result["error"]
        print("❌")
        print("    код {}: {}".format(err.get("error_code"), err.get("error_string")))
        print("    {}".format(err.get("error_detail", "")))
        return None

    # Ошибки отдельных элементов (AddResults)
    add_results = result.get("result", result).get("AddResults", [])
    errors = []
    for i, r in enumerate(add_results):
        if "Errors" in r:
            for e in r["Errors"]:
                errors.append("  [{}] {}: {}".format(i, e.get("Code"), e.get("Message")))

    if errors:
        print("⚠️ (есть ошибки)")
        for e in errors:
            print("   " + e)
    else:
        print("✅")

    return result.get("result", result)


# ─── Парсинг CSV ──────────────────────────────────────────────────────────────

def parse_csv(path):
    """
    Разбирает CSV выгрузки Директа в структуру:
      groups: OrderedDict  { номер: { name, ads[], keywords[], callouts[] } }
      sitelinks: { titles[], descriptions[], hrefs[] }  или None
    """
    groups = OrderedDict()
    sitelinks = None

    with open(path, encoding="utf-8") as f:
        raw = f.readlines()

    # Файл имеет формат:  <номер_строки><TAB><данные через ;>
    # Убираем префикс с номером строки
    clean = []
    for line in raw:
        parts = line.split("\t", 1)
        clean.append(parts[1] if len(parts) == 2 else line)

    reader = csv.DictReader(clean, delimiter=";")

    for row in reader:
        gnum = (row.get("Номер группы") or "").strip()
        if not gnum:
            continue

        is_main = (row.get("Доп. объявление группы") or "").strip() == "-"
        gname = (row.get("Название группы") or "").strip()
        keyword = (row.get("Фраза (с минус-словами)") or "").strip()
        title1 = (row.get("Заголовок 1") or "").strip()
        title2 = (row.get("Заголовок 2") or "").strip()
        text = (row.get("Текст") or "").strip()
        href = (row.get("Ссылка") or "").strip()
        callouts_str = (row.get("Уточнения") or "").strip()
        extra_kws = (row.get("Минус-фразы на группу") or "").strip()

        # ─── инициализация группы ───
        if gnum not in groups:
            groups[gnum] = {
                "name": gname,
                "ads": [],
                "keywords": [],
                "callouts": [],
                "has_autotargeting": False,
            }

        # ─── быстрые ссылки (одинаковые для всех, берём из первого) ───
        if sitelinks is None:
            sl_t = (row.get("Заголовки быстрых ссылок") or "").strip()
            sl_d = (row.get("Описания быстрых ссылок") or "").strip()
            sl_h = (row.get("Адреса быстрых ссылок") or "").strip()
            if sl_t:
                sitelinks = {
                    "titles": [x.strip() for x in sl_t.split("||")],
                    "descriptions": [x.strip() for x in sl_d.split("||")] if sl_d else [],
                    "hrefs": [x.strip() for x in sl_h.split("||")],
                }

        # ─── уточнения (могут отличаться по группам) ───
        if callouts_str and not groups[gnum]["callouts"]:
            groups[gnum]["callouts"] = [
                c.strip() for c in callouts_str.split("||") if c.strip()
            ]

        # ─── объявление ───
        groups[gnum]["ads"].append({
            "title1": title1,
            "title2": title2,
            "text": text,
            "href": href,
            "is_main": is_main,
        })

        # ─── ключевая фраза ───
        if keyword == "---autotargeting":
            groups[gnum]["has_autotargeting"] = True
        elif keyword and keyword not in groups[gnum]["keywords"]:
            groups[gnum]["keywords"].append(keyword)

        # ─── доп. фразы из главной строки (через ||, может заканчиваться ; ) ───
        if is_main and extra_kws:
            extra_kws = extra_kws.rstrip(";")
            for kw in extra_kws.split("||"):
                kw = kw.strip()
                if kw and kw not in groups[gnum]["keywords"]:
                    groups[gnum]["keywords"].append(kw)

    return groups, sitelinks


# ─── Создание сущностей ───────────────────────────────────────────────────────

def create_sitelinks(data):
    """Создаёт расширение «Быстрые ссылки», возвращает Id."""
    sitelinks = []
    for i in range(len(data["titles"])):
        sl = {"Title": data["titles"][i], "Href": data["hrefs"][i]}
        if i < len(data["descriptions"]) and data["descriptions"][i]:
            sl["Description"] = data["descriptions"][i]
        sitelinks.append(sl)

    result = api("adextensions", "add", {
        "AdExtensions": [{"SitelinksExtension": {"Sitelinks": sitelinks}}]
    })
    if result and result.get("AddResults"):
        ext_id = result["AddResults"][0].get("Id")
        if ext_id:
            print("    📎 Sitelinks ID = {}".format(ext_id))
        return ext_id
    return None


def create_callouts(texts):
    """Создаёт расширение «Уточнения», возвращает Id."""
    result = api("adextensions", "add", {
        "AdExtensions": [{"CalloutExtension": {"Callouts": texts}}]
    })
    if result and result.get("AddResults"):
        ext_id = result["AddResults"][0].get("Id")
        if ext_id:
            print("    🏷  Callouts ID = {}".format(ext_id))
        return ext_id
    return None


def create_campaign(name):
    """Создаёт текстово-графическую кампанию, возвращает Id."""
    result = api("campaigns", "add", {
        "Campaigns": [{
            "Name": name,
            "StartDate": date.today().isoformat(),
            "TextCampaign": {
                "BiddingStrategy": {
                    "Search": {"BiddingStrategyType": "HIGHEST_POSITION"},
                    "Network": {"BiddingStrategyType": "MANUAL_CPC"},
                },
                "Settings": [
                    {"Option": "ADD_METRICA_TAG", "Value": "YES"},
                    {"Option": "ENABLE_SITE_STATS", "Value": "YES"},
                ],
            },
        }]
    })
    if result and result.get("AddResults"):
        cid = result["AddResults"][0].get("Id")
        if cid:
            print("    📋 Campaign ID = {}".format(cid))
        return cid
    return None


def create_ad_group(campaign_id, name):
    """Создаёт группу объявлений, возвращает Id."""
    result = api("adgroups", "add", {
        "AdGroups": [{
            "Name": name,
            "CampaignId": campaign_id,
            "RegionIds": [VLADIVOSTOK_GEO],
        }]
    })
    if result and result.get("AddResults"):
        gid = result["AddResults"][0].get("Id")
        if gid:
            print("    📁 Группа «{}» ID = {}".format(name, gid))
        return gid
    return None


def create_keywords(group_id, keywords, bid):
    """Создаёт ключевые фразы, возвращает список Id."""
    if not keywords:
        return []

    kw_list = [{"AdGroupId": group_id, "Keyword": kw, "Bid": bid} for kw in keywords]
    result = api("keywords", "add", {"Keywords": kw_list})

    ids = []
    if result and result.get("AddResults"):
        for r in result["AddResults"]:
            if "Id" in r:
                ids.append(r["Id"])
    print("    📌 Создано фраз: {}".format(len(ids)))
    return ids


def create_ads(group_id, ads, sitelink_id, callout_id):
    """Создаёт текстовые объявления, возвращает список Id."""
    items = []
    for ad in ads:
        text_ad = {
            "Title": ad["title1"],
            "Text": ad["text"],
            "Href": ad["href"],
        }
        if ad["title2"]:
            text_ad["Title2"] = ad["title2"]
        if sitelink_id:
            text_ad["SitelinkSetId"] = sitelink_id
        if callout_id:
            text_ad["AdExtensions"] = [
                {"AdExtensionId": callout_id, "Type": "CALLOUT"}
            ]
        items.append({"AdGroupId": group_id, "TextAd": text_ad})

    result = api("ads", "add", {"Ads": items})
    ids = []
    if result and result.get("AddResults"):
        for r in result["AddResults"]:
            if "Id" in r:
                ids.append(r["Id"])
    print("    📝 Создано объявлений: {}".format(len(ids)))
    return ids


# ─── main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Создание кампании Яндекс Директ из CSV"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Только показать что будет создано (без запросов к API)",
    )
    args = parser.parse_args()

    print("════════════════════════════════════════════════════")
    print("  Climate Hall — создание кампании Яндекс Директ")
    print("════════════════════════════════════════════════════\n")

    # 1. Парсинг CSV
    print("📂 Чтение CSV...")
    groups, sitelinks = parse_csv(CSV_PATH)

    for gnum, gdata in groups.items():
        print(
            "  [{}] {}: {} объявл., {} фраз, автотаргет={}".format(
                gnum,
                gdata["name"],
                len(gdata["ads"]),
                len(gdata["keywords"]),
                gdata["has_autotargeting"],
            )
        )
    print()

    # Dry-run: только показать данные
    if args.dry_run:
        print("🧪 DRY-RUN — данные прочитаны, запросы к API НЕ отправляются.\n")
        print(json.dumps(
            {
                "groups": {
                    k: {
                        "name": v["name"],
                        "ads": len(v["ads"]),
                        "keywords": v["keywords"],
                        "callouts": v["callouts"],
                        "autotargeting": v["has_autotargeting"],
                    }
                    for k, v in groups.items()
                },
                "sitelinks": bool(sitelinks),
                "geo": VLADIVOSTOK_GEO,
                "bid_api_units": DEFAULT_BID,
            },
            ensure_ascii=False,
            indent=2,
        ))
        return

    # ─── Реальное создание ────────────────────────────────────────────────

    # 2. Быстрые ссылки (одни на всю кампанию)
    print("📎 Быстрые ссылки...")
    sitelink_id = create_sitelinks(sitelinks) if sitelinks else None

    # 3. Кампания
    print("\n📋 Кампания...")
    campaign_id = create_campaign(CAMPAIGN_NAME)
    if not campaign_id:
        sys.exit("❌ Не удалось создать кампанию")

    # 4. Группы
    total_ads = 0
    total_kws = 0

    for gnum, gdata in groups.items():
        print("\n── [{}] {} ──".format(gnum, gdata["name"]))

        # Уточнения для этой группы
        callout_id = None
        if gdata["callouts"]:
            callout_id = create_callouts(gdata["callouts"])

        # Группа
        group_id = create_ad_group(campaign_id, gdata["name"])
        if not group_id:
            print("    ⚠️  Пропуск группы")
            continue

        # Ключевые фразы
        kw_ids = create_keywords(group_id, gdata["keywords"], DEFAULT_BID)
        total_kws += len(kw_ids)

        # Объявления
        ad_ids = create_ads(group_id, gdata["ads"], sitelink_id, callout_id)
        total_ads += len(ad_ids)

    # 5. Итог
    print("\n════════════════════════════════════════════════════")
    print("  ✅ Кампания «{}» создана".format(CAMPAIGN_NAME))
    print("  Campaign ID : {}".format(campaign_id))
    print("  Групп       : {}".format(len(groups)))
    print("  Фраз        : {}".format(total_kws))
    print("  Объявлений  : {}".format(total_ads))
    print("════════════════════════════════════════════════════")


if __name__ == "__main__":
    main()
