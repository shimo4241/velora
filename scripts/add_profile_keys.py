import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
locales = ["en", "fr", "es", "ar"]

new_keys = {
    "en": {
        "toast_auth_required_title": "Login Required",
        "toast_auth_required_msg": "Please log in to add this user to your network.",
        "toast_self_connect_error_title": "Action Impossible",
        "toast_self_connect_error_msg": "You cannot add yourself to your own network.",
        "toast_network_updated_title": "Network Updated",
        "toast_network_updated_msg": "has been added to your network.",
        "toast_network_error_title": "Error",
        "toast_network_error_msg": "Could not add this profile to your network.",
        "biography_header": "Biography",
        "skills_header": "Skills",
        "experience_header": "Experience",
        "portfolio_header": "Projects",
        "public_profile_badge": "Your public profile",
        "back_label": "Back"
    },
    "fr": {
        "toast_auth_required_title": "Connexion requise",
        "toast_auth_required_msg": "Veuillez vous connecter pour ajouter un membre à votre réseau.",
        "toast_self_connect_error_title": "Action impossible",
        "toast_self_connect_error_msg": "Vous ne pouvez pas vous ajouter à votre propre réseau.",
        "toast_network_updated_title": "Réseau mis à jour",
        "toast_network_updated_msg": "a été ajouté à votre réseau.",
        "toast_network_error_title": "Erreur",
        "toast_network_error_msg": "Impossible d'ajouter ce profil à votre réseau.",
        "biography_header": "Biographie",
        "skills_header": "Compétences",
        "experience_header": "Expérience",
        "portfolio_header": "Réalisations",
        "public_profile_badge": "Votre profil public",
        "back_label": "Retour"
    },
    "es": {
        "toast_auth_required_title": "Inicio de sesión requerido",
        "toast_auth_required_msg": "Por favor, inicia sesión para añadir a este usuario a tu red.",
        "toast_self_connect_error_title": "Acción imposible",
        "toast_self_connect_error_msg": "No puedes añadirte a tu propia red.",
        "toast_network_updated_title": "Red actualizada",
        "toast_network_updated_msg": "ha sido añadido a tu red.",
        "toast_network_error_title": "Error",
        "toast_network_error_msg": "No se pudo añadir este perfil a tu red.",
        "biography_header": "Biografía",
        "skills_header": "Habilidades",
        "experience_header": "Experiencia",
        "portfolio_header": "Proyectos",
        "public_profile_badge": "Tu perfil público",
        "back_label": "Volver"
    },
    "ar": {
        "toast_auth_required_title": "تسجيل الدخول مطلوب",
        "toast_auth_required_msg": "يرجى تسجيل الدخول لإضافة هذا المستخدم إلى شبكتك.",
        "toast_self_connect_error_title": "إجراء غير ممكن",
        "toast_self_connect_error_msg": "لا يمكنك إضافة نفسك إلى شبكتك الخاصة.",
        "toast_network_updated_title": "تم تحديث الشبكة",
        "toast_network_updated_msg": "تمت إضافته إلى شبكتك.",
        "toast_network_error_title": "خطأ",
        "toast_network_error_msg": "تعذر إضافة هذا الملف الشخصي إلى شبكتك.",
        "biography_header": "السيرة الذاتية",
        "skills_header": "المهارات",
        "experience_header": "الخبرة",
        "portfolio_header": "المشاريع",
        "public_profile_badge": "ملفك الشخصي العام",
        "back_label": "رجوع"
    }
}

for loc in locales:
    path = os.path.join(locale_dir, f"{loc}.json")
    with open(path, "r", encoding="utf-8") as f:
        content = json.load(f)
    
    # Update content with new keys
    content.update(new_keys[loc])
    
    # Save back sorted content
    with open(path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)

print("Dictionaries updated successfully!")
