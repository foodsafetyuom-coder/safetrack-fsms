#!/usr/bin/env python3
"""
Génère les icônes PWA SafeTrack (192x192 et 512x512)
Dépendance : pip install Pillow --break-system-packages
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fond rouge Palmary avec coins arrondis
    radius = size // 5
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill='#C8102E')

    # Lettre "ST" centrée en blanc
    font_size = size // 3
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()

    text = 'ST'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), text, fill='white', font=font)

    img.save(output_path, 'PNG')
    print(f'Icône générée : {output_path}')

os.makedirs('icons', exist_ok=True)
create_icon(192, 'icons/icon-192.png')
create_icon(512, 'icons/icon-512.png')
print('Icônes PWA SafeTrack créées avec succès.')
