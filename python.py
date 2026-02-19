# main.py
import logging
import random
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ConversationHandler,
    MessageHandler,
    filters,
    ContextTypes
)
from telegram.constants import ParseMode

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Константы состояний для разговоров
BAN_USER, UNBAN_USER, GIFT_USER, WITHDRAW_APPROVE = range(4)

# ID администраторов (замените на свои)
ADMIN_IDS = [123456789]  # Ваш Telegram ID

# Файлы для хранения данных
USERS_FILE = 'users.json'
WITHDRAWALS_FILE = 'withdrawals.json'
INVENTORY_FILE = 'inventory.json'

# Подарки и их стоимость
GIFTS = {
    'мишка_сердце': {'name': '🐻 Мишка с сердцем', 'price': 15, 'emoji': '🧸'},
    'роза': {'name': '🌹 Роза', 'price': 25, 'emoji': '🌹'},
    'букетик': {'name': '💐 Букетик', 'price': 15, 'emoji': '💐'},
    'подарок': {'name': '🎁 Подарок', 'price': 10, 'emoji': '🎁'}
}

# Загрузка данных из файлов
def load_data(filename, default=None):
    if default is None:
        default = {}
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Ошибка загрузки {filename}: {e}")
    return default

def save_data(filename, data):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Ошибка сохранения {filename}: {e}")

# Класс для управления пользователями
class UserManager:
    def __init__(self):
        self.users = load_data(USERS_FILE)
        self.inventory = load_data(INVENTORY_FILE, {})
        self.withdrawals = load_data(WITHDRAWALS_FILE, [])
    
    def save_all(self):
        save_data(USERS_FILE, self.users)
        save_data(INVENTORY_FILE, self.inventory)
        save_data(WITHDRAWALS_FILE, self.withdrawals)
    
    def get_user(self, user_id):
        user_id = str(user_id)
        if user_id not in self.users:
            self.users[user_id] = {
                'stars': 100,  # Начальный баланс для тестирования
                'username': '',
                'first_name': '',
                'joined_date': datetime.now().isoformat(),
                'is_banned': False
            }
        return self.users[user_id]
    
    def update_user_info(self, user_id, username, first_name):
        user_id = str(user_id)
        user = self.get_user(user_id)
        user['username'] = username
        user['first_name'] = first_name
        self.save_all()
    
    def add_stars(self, user_id, amount):
        user_id = str(user_id)
        user = self.get_user(user_id)
        user['stars'] += amount
        self.save_all()
    
    def remove_stars(self, user_id, amount):
        user_id = str(user_id)
        user = self.get_user(user_id)
        if user['stars'] >= amount:
            user['stars'] -= amount
            self.save_all()
            return True
        return False
    
    def add_gift(self, user_id, gift_key):
        user_id = str(user_id)
        if user_id not in self.inventory:
            self.inventory[user_id] = []
        self.inventory[user_id].append({
            'gift': gift_key,
            'received_date': datetime.now().isoformat()
        })
        self.save_all()
    
    def get_inventory(self, user_id):
        user_id = str(user_id)
        return self.inventory.get(user_id, [])
    
    def create_withdrawal(self, user_id, gift_key):
        withdrawal = {
            'id': len(self.withdrawals) + 1,
            'user_id': str(user_id),
            'gift': gift_key,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(days=7)).isoformat()
        }
        self.withdrawals.append(withdrawal)
        self.save_all()
        return withdrawal
    
    def get_pending_withdrawals(self):
        return [w for w in self.withdrawals if w['status'] == 'pending']
    
    def approve_withdrawal(self, withdrawal_id):
        for w in self.withdrawals:
            if w['id'] == withdrawal_id:
                w['status'] = 'approved'
                self.save_all()
                return True
        return False

user_manager = UserManager()

# Основные команды
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_manager.update_user_info(user.id, user.username, user.first_name)
    
    # Проверка на бан
    if user_manager.get_user(user.id).get('is_banned', False):
        await update.message.reply_text("❌ Вы забанены в боте.")
        return
    
    keyboard = [
        [InlineKeyboardButton("🎰 Крутить рулетку", callback_data="spin")],
        [InlineKeyboardButton("👤 Мой профиль", callback_data="profile")],
        [InlineKeyboardButton("🎁 Мои подарки", callback_data="inventory")],
        [InlineKeyboardButton("💰 Магазин", callback_data="shop")]
    ]
    
    # Добавляем админ-панель для администраторов
    if user.id in ADMIN_IDS:
        keyboard.append([InlineKeyboardButton("⚙️ Админ панель", callback_data="admin")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"🎉 Добро пожаловать в рулетку подарков, {user.first_name}!\n\n"
        f"У тебя {user_manager.get_user(user.id)['stars']} ⭐️ звезд\n\n"
        f"Крути рулетку и выигрывай подарки!",
        reply_markup=reply_markup
    )

# Обработка callback кнопок
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    user_id = user.id
    
    # Проверка на бан
    if user_manager.get_user(user_id).get('is_banned', False):
        await query.edit_message_text("❌ Вы забанены в боте.")
        return
    
    if query.data == "spin":
        await show_spin_menu(query)
    elif query.data == "profile":
        await show_profile(query, user_id)
    elif query.data == "inventory":
        await show_inventory(query, user_id)
    elif query.data == "shop":
        await show_shop(query, user_id)
    elif query.data == "admin" and user_id in ADMIN_IDS:
        await show_admin_panel(query)
    elif query.data.startswith("spin_"):
        await process_spin(query, user_id, query.data.split("_")[1])
    elif query.data.startswith("buy_"):
        await process_buy(query, user_id, query.data.split("_")[1])
    elif query.data.startswith("withdraw_"):
        await process_withdraw_request(query, user_id, query.data.split("_")[1])
    elif query.data == "admin_users":
        await show_users_list(query)
    elif query.data == "admin_withdrawals":
        await show_withdrawals(query)
    elif query.data.startswith("approve_"):
        withdrawal_id = int(query.data.split("_")[1])
        await approve_withdrawal(query, withdrawal_id)

async def show_spin_menu(query):
    keyboard = []
    for key, gift in GIFTS.items():
        keyboard.append([InlineKeyboardButton(
            f"{gift['emoji']} {gift['name']} - {gift['price']} ⭐️",
            callback_data=f"spin_{key}"
        )])
    keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        "🎰 Выбери подарок, который хочешь выиграть:\n\n"
        "Чем дороже подарок, тем меньше шанс выигрыша!",
        reply_markup=reply_markup
    )

async def show_profile(query, user_id):
    user_data = user_manager.get_user(user_id)
    inventory = user_manager.get_inventory(user_id)
    
    text = (
        f"👤 Профиль пользователя\n\n"
        f"🆔 ID: {user_id}\n"
        f"⭐️ Баланс: {user_data['stars']} звезд\n"
        f"🎁 Подарков: {len(inventory)}\n"
        f"📅 Зарегистрирован: {user_data['joined_date'][:10]}\n"
    )
    
    keyboard = [[InlineKeyboardButton("◀️ Назад", callback_data="back")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup)

async def show_inventory(query, user_id):
    inventory = user_manager.get_inventory(user_id)
    
    if not inventory:
        text = "🎁 У вас пока нет подарков"
    else:
        text = "🎁 Ваши подарки:\n\n"
        for i, item in enumerate(inventory, 1):
            gift = GIFTS[item['gift']]
            date = item['received_date'][:10]
            text += f"{i}. {gift['emoji']} {gift['name']} (получен {date})\n"
    
    keyboard = [
        [InlineKeyboardButton("💰 Продать подарок", callback_data="sell_menu")],
        [InlineKeyboardButton("◀️ Назад", callback_data="back")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup)

async def show_shop(query, user_id):
    text = "💰 Магазин подарков\n\nКупи подарок сразу или попробуй выиграть в рулетке!"
    
    keyboard = []
    for key, gift in GIFTS.items():
        keyboard.append([InlineKeyboardButton(
            f"Купить {gift['emoji']} {gift['name']} - {gift['price']} ⭐️",
            callback_data=f"buy_{key}"
        )])
    keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text, reply_markup=reply_markup)

async def process_spin(query, user_id, gift_key):
    gift = GIFTS[gift_key]
    price = gift['price']
    
    # Проверка баланса
    if not user_manager.remove_stars(user_id, price):
        await query.edit_message_text(
            f"❌ Недостаточно звезд! Нужно {price} ⭐️",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("◀️ Назад", callback_data="spin")
            ]])
        )
        return
    
    # Шанс выигрыша (чем дороже подарок, тем меньше шанс)
    win_chance = {
        10: 0.5,   # 50% для подарка за 10 звезд
        15: 0.3,   # 30% для подарков за 15 звезд
        25: 0.15   # 15% для розы за 25 звезд
    }.get(price, 0.3)
    
    won = random.random() < win_chance
    
    if won:
        user_manager.add_gift(user_id, gift_key)
        result_text = f"🎉 Поздравляем! Ты выиграл {gift['emoji']} {gift['name']}!"
    else:
        result_text = f"😢 К сожалению, ты не выиграл. Потрачено {price} ⭐️"
    
    keyboard = [
        [InlineKeyboardButton("🔄 Крутить еще", callback_data="spin")],
        [InlineKeyboardButton("◀️ Назад в меню", callback_data="back")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(result_text, reply_markup=reply_markup)

async def process_buy(query, user_id, gift_key):
    gift = GIFTS[gift_key]
    price = gift['price']
    
    if user_manager.remove_stars(user_id, price):
        user_manager.add_gift(user_id, gift_key)
        text = f"✅ Ты купил {gift['emoji']} {gift['name']} за {price} ⭐️"
    else:
        text = f"❌ Недостаточно звезд! Нужно {price} ⭐️"
    
    keyboard = [[InlineKeyboardButton("◀️ Назад в магазин", callback_data="shop")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup)

async def process_withdraw_request(query, user_id, gift_key):
    # Проверяем, есть ли такой подарок у пользователя
    inventory = user_manager.get_inventory(user_id)
    has_gift = any(item['gift'] == gift_key for item in inventory)
    
    if not has_gift:
        await query.edit_message_text(
            "❌ У вас нет такого подарка!",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("◀️ Назад", callback_data="inventory")
            ]])
        )
        return
    
    # Создаем заявку на вывод
    withdrawal = user_manager.create_withdrawal(user_id, gift_key)
    
    # Уведомление админу
    for admin_id in ADMIN_IDS:
        try:
            gift_name = GIFTS[gift_key]['name']
            await context.bot.send_message(
                admin_id,
                f"🔔 Новая заявка на вывод!\n\n"
                f"От: {query.from_user.first_name} (@{query.from_user.username})\n"
                f"ID: {user_id}\n"
                f"Подарок: {gift_name}\n"
                f"ID заявки: {withdrawal['id']}\n"
                f"Истекает: {withdrawal['expires_at'][:10]}"
            )
        except:
            pass
    
    await query.edit_message_text(
        f"✅ Заявка на вывод создана!\n\n"
        f"Администратор рассмотрит её в течение 7 дней.\n"
        f"ID заявки: {withdrawal['id']}",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("◀️ Назад", callback_data="inventory")
        ]])
    )

# Админ панель
async def show_admin_panel(query):
    users_count = len(user_manager.users)
    pending_withdrawals = len(user_manager.get_pending_withdrawals())
    
    keyboard = [
        [InlineKeyboardButton("👥 Список пользователей", callback_data="admin_users")],
        [InlineKeyboardButton("💰 Заявки на вывод", callback_data=f"admin_withdrawals")],
        [InlineKeyboardButton("🔨 Забанить пользователя", callback_data="admin_ban")],
        [InlineKeyboardButton("🎁 Выдать подарок", callback_data="admin_gift")],
        [InlineKeyboardButton("⭐️ Выдать звезды", callback_data="admin_stars")],
        [InlineKeyboardButton("◀️ Назад", callback_data="back")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        f"⚙️ Админ панель\n\n"
        f"👥 Всего пользователей: {users_count}\n"
        f"⏳ Ожидают вывода: {pending_withdrawals}\n"
        f"🆔 Ваш ID: {query.from_user.id}",
        reply_markup=reply_markup
    )

async def show_users_list(query):
    text = "👥 Список пользователей:\n\n"
    
    for user_id, data in list(user_manager.users.items())[:20]:  # Показываем первых 20
        name = data.get('first_name', 'Нет имени')
        username = data.get('username', 'нет юзернейма')
        stars = data.get('stars', 0)
        banned = "🔴" if data.get('is_banned', False) else "🟢"
        
        text += f"{banned} {name} (@{username}) - {stars}⭐️\n"
    
    text += "\n🔴 - забанен, 🟢 - активен"
    
    keyboard = [[InlineKeyboardButton("◀️ Назад", callback_data="admin")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup)

async def show_withdrawals(query):
    withdrawals = user_manager.get_pending_withdrawals()
    
    if not withdrawals:
        text = "✅ Нет активных заявок на вывод"
    else:
        text = "⏳ Заявки на вывод:\n\n"
        for w in withdrawals:
            gift = GIFTS[w['gift']]['name']
            user_data = user_manager.get_user(w['user_id'])
            username = user_data.get('username', 'нет юзернейма')
            
            text += f"ID: {w['id']}\n"
            text += f"От: @{username}\n"
            text += f"Подарок: {gift}\n"
            text += f"До: {w['expires_at'][:10]}\n\n"
            
            keyboard = [[InlineKeyboardButton(
                f"✅ Подтвердить вывод #{w['id']}",
                callback_data=f"approve_{w['id']}"
            )]]
    
    keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="admin")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(text, reply_markup=reply_markup)

async def approve_withdrawal(query, withdrawal_id):
    if user_manager.approve_withdrawal(withdrawal_id):
        await query.edit_message_text(
            f"✅ Заявка #{withdrawal_id} подтверждена!",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("◀️ Назад", callback_data="admin_withdrawals")
            ]])
        )
    else:
        await query.edit_message_text(
            "❌ Ошибка подтверждения заявки",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("◀️ Назад", callback_data="admin_withdrawals")
            ]])
        )

# Обработчики команд
async def back_to_main(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await start(update, context)

def main():
    # Токен бота (замените на свой)
    token = "YOUR_BOT_TOKEN_HERE"
    
    # Создание приложения
    application = Application.builder().token(token).build()
    
    # Добавление обработчиков
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(CallbackQueryHandler(back_to_main, pattern="^back$"))
    
    # Запуск бота
    print("Бот запущен...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()