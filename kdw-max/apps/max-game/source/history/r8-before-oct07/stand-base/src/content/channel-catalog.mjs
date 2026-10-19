import {freezeTaskCatalog} from '../contracts/task-catalog.mjs';

// Original client frames; independent of Site/WebGL and animation state.
/** @type {import('../contracts/task-catalog.mjs').TaskCatalog} */
export const CHANNEL_CATALOG = freezeTaskCatalog({
  "schemaVersion": 1,
  "contentRevision": "channel-20261002-v1",
  "missionId": "blogger",
  "taskId": "blogger.channel",
  "startScreenId": "blogger.channel.chats",
  "assets": {
    "client.frame-91504": {
      "assetId": "client.frame-91504",
      "path": "assets/client-media/frame-91504.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "d9708ef0e897ddd5d6bae2adf42cb1c62aa6232c1f50e4c0dd35d08226e3688a",
      "origin": {
        "kind": "client-frame",
        "frameId": 91504
      }
    },
    "client.frame-91516": {
      "assetId": "client.frame-91516",
      "path": "assets/client-media/frame-91516.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "55766cf655f5e6043a7d680c0b4a05813e4924d63445959f9404fdcca01b9d6e",
      "origin": {
        "kind": "client-frame",
        "frameId": 91516
      }
    },
    "client.frame-91547": {
      "assetId": "client.frame-91547",
      "path": "assets/client-media/frame-91547.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "b30b4e5d196462a6c12f83b730c7d1743144b5fa8a2cdc22049ba7424d4a2483",
      "origin": {
        "kind": "client-frame",
        "frameId": 91547
      }
    },
    "client.frame-91553": {
      "assetId": "client.frame-91553",
      "path": "assets/client-media/frame-91553.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "f8e30d8bcf1399aea3c8c04f0e887373b95029b37e2083637e89f513a2c47dcc",
      "origin": {
        "kind": "client-frame",
        "frameId": 91553
      }
    },
    "client.frame-91559": {
      "assetId": "client.frame-91559",
      "path": "assets/client-media/frame-91559.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "7f0e37392654bc83d04e6528cb8a8f8d96453384a7ebd14acff8573880a976b1",
      "origin": {
        "kind": "client-frame",
        "frameId": 91559
      }
    },
    "client.frame-91662": {
      "assetId": "client.frame-91662",
      "path": "assets/client-media/frame-91662.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "3a74ea1d07de9c07c5d9d154637fda319808dad62cd1cb496fde41d77e8b744a",
      "origin": {
        "kind": "client-frame",
        "frameId": 91662
      }
    },
    "client.frame-91612": {
      "assetId": "client.frame-91612",
      "path": "assets/client-media/frame-91612.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "b0105467c97c8edf795b8dab3b5a780f198aac323a5f706fbccbf9ff05b1e048",
      "origin": {
        "kind": "client-frame",
        "frameId": 91612
      }
    },
    "client.frame-91637": {
      "assetId": "client.frame-91637",
      "path": "assets/client-media/frame-91637.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "4bd87813f383f46804f1f1971e2b4264eb3540a93d54678d8e24a130b9c8eb50",
      "origin": {
        "kind": "client-frame",
        "frameId": 91637
      }
    },
    "client.frame-91689": {
      "assetId": "client.frame-91689",
      "path": "assets/client-media/frame-91689.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "6f703a9679f70e6842d925ac3919b8a072a26c82cbeb51e18c7a9b3ce9aaccd3",
      "origin": {
        "kind": "client-frame",
        "frameId": 91689
      }
    },
    "client.frame-91714": {
      "assetId": "client.frame-91714",
      "path": "assets/client-media/frame-91714.png",
      "mimeType": "image/png",
      "width": 360,
      "height": 800,
      "sha256": "0ec15594df56d4fac956561ab16610d01ade84380a8871f0efbb0d828bb08f20",
      "origin": {
        "kind": "client-frame",
        "frameId": 91714
      }
    }
  },
  "screens": {
    "blogger.channel.chats": {
      "screenId": "blogger.channel.chats",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91504",
      "instruction": "Приступаем к созданию канала в MAX. Нажмите «+» вверху экрана.",
      "actions": [
        {
          "actionId": "channel.open-create-menu",
          "label": "Открыть меню создания",
          "placement": "hotspot",
          "rect": [
            308,
            54,
            48,
            48
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.menu"
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.menu": {
      "screenId": "blogger.channel.menu",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91516",
      "instruction": "Выберите «Создать канал».",
      "actions": [
        {
          "actionId": "channel.choose-create",
          "label": "Создать канал",
          "placement": "hotspot",
          "rect": [
            12,
            164,
            336,
            56
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.name"
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.name": {
      "screenId": "blogger.channel.name",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91547",
      "instruction": "Придумаем название канала и расскажем, о чём он будет. Нажмите поле названия — покажем учебный пример.",
      "actions": [
        {
          "actionId": "channel.fill-name-example",
          "label": "Заполнить учебный пример",
          "placement": "hotspot",
          "rect": [
            12,
            288,
            336,
            144
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.filled"
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.filled": {
      "screenId": "blogger.channel.filled",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91553",
      "instruction": "В примере канал называется «Фильмы и сериалы». Нажмите «Создать канал» внизу экрана.",
      "actions": [
        {
          "actionId": "channel.create",
          "label": "Создать канал",
          "placement": "hotspot",
          "rect": [
            12,
            708,
            336,
            56
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.privacy"
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.privacy": {
      "screenId": "blogger.channel.privacy",
      "deviceKind": "phone",
      "mode": "choice",
      "assetId": "client.frame-91559",
      "instruction": "Выберите тип канала: приватный доступен по ссылке, публичный можно найти через поиск.",
      "actions": [
        {
          "actionId": "channel.choose-private",
          "label": "Приватный канал",
          "placement": "hotspot",
          "rect": [
            24,
            272,
            312,
            56
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.privacy",
            "answer": {
              "kind": "channel-type",
              "value": "private"
            }
          }
        },
        {
          "actionId": "channel.choose-public",
          "label": "Публичный канал",
          "placement": "hotspot",
          "rect": [
            24,
            330,
            312,
            56
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.public-confirm",
            "answer": {
              "kind": "channel-type",
              "value": "public"
            }
          }
        },
        {
          "actionId": "channel.continue-private",
          "label": "Продолжить с приватным каналом",
          "placement": "hotspot",
          "rect": [
            20,
            708,
            320,
            60
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.subscribers",
            "answer": {
              "kind": "channel-type",
              "value": "private"
            }
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.public-confirm": {
      "screenId": "blogger.channel.public-confirm",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91662",
      "instruction": "Для публичного канала нужна новая ссылка. Нажмите «Продолжить с новой». Прежнюю ссылку можно сохранить, вернувшись к приватному каналу.",
      "actions": [
        {
          "actionId": "channel.keep-old-link",
          "label": "Оставить прежнюю ссылку",
          "placement": "hotspot",
          "rect": [
            20,
            640,
            320,
            60
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.privacy",
            "answer": {
              "kind": "channel-type",
              "value": "private"
            }
          }
        },
        {
          "actionId": "channel.use-new-link",
          "label": "Продолжить с новой ссылкой",
          "placement": "hotspot",
          "rect": [
            20,
            712,
            320,
            60
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.public-link"
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.public-link": {
      "screenId": "blogger.channel.public-link",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91612",
      "instruction": "Придумайте уникальную ссылку публичного канала. Нажмите поле ссылки — покажем учебный пример.",
      "actions": [
        {
          "actionId": "channel.fill-link-example",
          "label": "Заполнить ссылку учебного примера",
          "placement": "hotspot",
          "rect": [
            24,
            348,
            312,
            52
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.public-filled"
          }
        }
      ],
      "annotations": [
        {
          "annotationId": "channel.public-link.header",
          "kind": "text-replacement",
          "text": "Публичный канал создан",
          "rect": [
            7.2,
            106,
            345.6,
            42
          ]
        }
      ]
    },
    "blogger.channel.public-filled": {
      "screenId": "blogger.channel.public-filled",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91637",
      "instruction": "Ссылка films свободна. Нажмите «Продолжить».",
      "actions": [
        {
          "actionId": "channel.save-public-link",
          "label": "Сохранить публичную ссылку",
          "placement": "hotspot",
          "rect": [
            20,
            448,
            320,
            60
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.subscribers",
            "answer": {
              "kind": "channel-type",
              "value": "public"
            }
          }
        }
      ],
      "annotations": [
        {
          "annotationId": "channel.public-filled.header",
          "kind": "text-replacement",
          "text": "Публичный канал создан",
          "rect": [
            7.2,
            106,
            345.6,
            42
          ]
        }
      ]
    },
    "blogger.channel.subscribers": {
      "screenId": "blogger.channel.subscribers",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91689",
      "instruction": "Канал уже создан. Приглашение подписчиков можно пропустить и вернуться к нему позже.",
      "actions": [
        {
          "actionId": "channel.skip-invites",
          "label": "Пропустить приглашение подписчиков",
          "placement": "hotspot",
          "rect": [
            20,
            708,
            320,
            60
          ],
          "outcome": {
            "kind": "navigate",
            "screenId": "blogger.channel.created"
          }
        }
      ],
      "annotations": []
    },
    "blogger.channel.created": {
      "screenId": "blogger.channel.created",
      "deviceKind": "phone",
      "mode": "manual",
      "assetId": "client.frame-91714",
      "instruction": "Канал создан! Теперь вы можете публиковать посты и общаться с подписчиками.",
      "actions": [
        {
          "actionId": "channel.complete",
          "label": "К следующему заданию",
          "placement": "below-screen",
          "outcome": {
            "kind": "complete-task"
          }
        }
      ],
      "annotations": []
    }
  }
});
