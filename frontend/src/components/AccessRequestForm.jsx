// src/components/AccessRequestForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessRequestForm() {
  const navigate = useNavigate();
  
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    organization: '',
    paymentMethod: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans = [
    { 
      id: 'invitado', 
      name: '🎟️ Invitado', 
      price: 15, 
      period: '5 días',
      desc: 'Encuestas ilimitadas por 5 días',
      features: ['Voto único', 'Resultados en vivo', 'Exportación CSV'],
      gift: ''
    },
    { 
      id: 'basico', 
      name: '🔷 Básico', 
      price: 100, 
      period: '3 meses',
      desc: 'Encuestas ilimitadas + APK Android',
      features: ['Voto único', 'Resultados en vivo', 'Exportación CSV', 'APK personalizada'],
      gift: ''
    },
    { 
      id: 'plata', 
      name: '🥈 Plata', 
      price: 150, 
      period: '6 meses',
      desc: 'Encuestas ilimitadas + APK Android + Dominio personalizado',
      features: ['Voto único', 'Resultados en vivo', 'Exportación CSV', 'APK personalizada', 'Dominio incluido'],
      gift: ''
    },
    { 
      id: 'oro', 
      name: '🥇 Oro', 
      price: 250, 
      period: '1 año',
      desc: 'Encuestas ilimitadas + APK Android + Dominio + Soporte prioritario',
      features: ['Voto único', 'Resultados en vivo', 'Exportación CSV', 'APK personalizada', 'Dominio incluido', 'Soporte 24/7'],
      gift: ''
    },
    { 
      id: 'ilimitado', 
      name: '💎 Socio Ilimitado', 
      price: 500, 
      period: 'Vitalicio',
      desc: 'Acceso vitalicio + Todos los beneficios',
      features: ['Voto único', 'Resultados en vivo', 'Exportación CSV', 'APK personalizada', 'Dominio incluido', 'Soporte 24/7', 'Actualizaciones permanentes'],
      gift: '🎁 ¡REGALO EXCLUSIVO! Incluye una SEGUNDA APLICACIÓN FUNCIONAL para dar a un aliado o usar en otra organización.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openWhatsAppNative = (message) => {
    const encodedMessage = encodeURIComponent(message);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // En móvil: abre la app nativa de WhatsApp
      window.location.assign(`whatsapp://send?phone=573106524453&text=${encodedMessage}`);
    } else {
      // En PC: abre WhatsApp Web (no se puede forzar la app de escritorio)
      window.open(`https://web.whatsapp.com/send?phone=573106524453&text=${encodedMessage}`, '_blank');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      alert('⚠️ Por favor selecciona un plan.');
      return;
    }
    if (!formData.fullName || !formData.email || !formData.organization) {
      alert('⚠️ Por favor completa los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    
    // Construir mensaje para WhatsApp
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const message = `
*¡NUEVA SOLICITUD DE ENCUESTAS PRO!*

*📋 PLAN SELECCIONADO:*
${selectedPlanData.name} (${selectedPlanData.period}) - $${selectedPlanData.price} USD
${selectedPlanData.desc}
${selectedPlanData.gift}

*✨ BENEFICIOS INCLUIDOS:*
${selectedPlanData.features.map(f => `• ${f}`).join('\n')}

*👤 DATOS DEL CLIENTE:*
• Nombre: ${formData.fullName}
• Correo: ${formData.email}
• Teléfono: ${formData.phone}
• País: ${formData.country}
• Ciudad: ${formData.city}
• Organización: ${formData.organization}
• Método de pago: ${formData.paymentMethod}

*💬 Estado: Esperando confirmación de pago*

¡Gracias por elegir Encuestas Pro! 💚💛❤️
    `.trim();

    openWhatsAppNative(message);
    
    // Resetear formulario
    setSelectedPlan('');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      organization: '',
      paymentMethod: ''
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple">
            📊 ¡Conviértete en Socio de Encuestas Pro!
          </h1>
          <p className="text-gray-400 mt-2">
            Elige tu plan y obtén acceso inmediato a encuestas ilimitadas
          </p>
        </div>

        {/* Tarjetas de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'bg-gradient-to-br from-neonBlue/20 to-neonPurple/20 border-neonCyan shadow-neonCyan/20 shadow-lg'
                  : 'bg-gray-800/60 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                <span className="bg-neonGreen text-gray-900 px-2 py-1 rounded font-bold">
                  ${plan.price}
                </span>
              </div>
              <p className="text-neonYellow text-sm mt-1">{plan.period}</p>
              <p className="text-gray-300 text-sm mt-2">{plan.desc}</p>
              <ul className="text-gray-400 text-xs mt-2 space-y-1">
                {plan.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
              {plan.gift && (
                <p className="text-neonPink text-xs mt-3 font-bold">{plan.gift}</p>
              )}
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-neonCyan">
          <h2 className="text-xl font-bold text-neonCyan mb-4 text-center">
            📝 Completa tus datos
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Nombre completo *"
                value={formData.fullName}
                onChange={handleInputChange}
                className="p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico *"
                value={formData.email}
                onChange={handleInputChange}
                className="p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Teléfono (opcional)"
                value={formData.phone}
                onChange={handleInputChange}
                className="p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
              />
              <input
                type="text"
                name="organization"
                placeholder="Organización *"
                value={formData.organization}
                onChange={handleInputChange}
                className="p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
                required
              />
              <input
                type="text"
                name="country"
                placeholder="País *"
                value={formData.country}
                onChange={handleInputChange}
                className="p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
                required
              />
              <input
                type="text"
                name="city"
                placeholder="Ciudad *"
                value={formData.city}
                onChange={handleInputChange}
                className="p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Método de pago en tu país *</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-600"
                required
              >
                <option value="">Selecciona un método</option>
                <option value="Transferencia bancaria">Transferencia bancaria</option>
                <option value="PayPal">PayPal</option>
                <option value="Stripe">Stripe</option>
                <option value="Nequi / Daviplata">Nequi / Daviplata (Colombia)</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedPlan || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                !selectedPlan || isSubmitting
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gradient-to-r from-neonGreen to-neonBlue text-gray-900 hover:opacity-90'
              }`}
            >
              {isSubmitting ? 'Enviando...' : '🚀 Enviar Solicitud'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-neonBlue hover:underline"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
