// netlify/functions/generate.js

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 1. Verificamos que la solicitud sea un POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Solo se permite el método POST' })
    };
  }

  // 2. Obtenemos el sentimiento del usuario desde el cuerpo de la solicitud
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Cuerpo de solicitud inválido' })
    };
  }

  const { feeling } = body;

  if (!feeling) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Falta el sentimiento en la solicitud.' })
    };
  }

  // 3. Obtenemos la API Key desde las variables de entorno de Netlify
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Debug para verificar variables de entorno
  console.log('API Key existe:', !!apiKey);
  console.log('Todas las variables:', Object.keys(process.env).filter(key => key.includes('GEMINI')));

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'La API Key no está configurada en el servidor.' })
    };
  }

  // 4. Preparamos la consulta para la IA de Google
  const systemPrompt = "Actúa como un campeón de fútbol argentino de fama mundial, un ídolo popular. Estás relajado en tu casa tomándote un fernet. Un amigo/fan te cuenta cómo se siente. Tu tarea es darle un consejo corto, cercano, humilde y sabio, como si fueras un amigo que lo escucha. Usa un lenguaje coloquial y argentino, pero sin nombrarte a ti mismo como 'Messi'. El tono debe ser motivador y positivo.";
  const userQuery = `La verdad es que me siento: "${feeling}". ¿Qué me dirías?`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  // 5. Hacemos la llamada a la API de Gemini (desde el servidor)
  try {
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json();
      console.error('Error de la API de Gemini:', errorBody);
      return {
        statusCode: geminiResponse.status,
        headers,
        body: JSON.stringify({ message: 'Error al comunicarse con la API de Gemini.' })
      };
    }

    const result = await geminiResponse.json();
    const messageText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!messageText) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'La respuesta de la API no tuvo contenido.' })
      };
    }
    
    // 6. Enviamos la respuesta de vuelta a nuestro frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: messageText })
    };

  } catch (error) {
    console.error('Error en la función del servidor:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor.' })
    };
  }
};