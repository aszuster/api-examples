import { NextResponse } from 'next/server';

// Logging function without sensitive information
function safeLog(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, {
    ...data,
    // No log sensitive information
    secretKey: data.secretKey ? '[REDACTED]' : undefined,
    token: data.token ? '[REDACTED]' : undefined,
  });
}

export async function POST(req) {
  safeLog('Inicio de verificación reCAPTCHA');

  try {
    // Verify that the method is POST
    if (req.method && req.method !== 'POST') {
      safeLog('Método no permitido', { method: req.method });
      return NextResponse.json(
        { error: 'Método no permitido' },
        { status: 405 }
      );
    }

    // Verify that we can parse the body
    let token;
    try {
      const body = await req.json();
      token = body.token;
      safeLog('Body parseado correctamente', { hasToken: !!token });
    } catch (parseError) {
      safeLog('Error al parsear JSON', { error: parseError.message });
      return NextResponse.json(
        { error: 'JSON inválido en el body de la petición' },
        { status: 400 }
      );
    }

    if (!token) {
      safeLog('Token no proporcionado');
      return NextResponse.json(
        { error: 'Token de reCAPTCHA no proporcionado' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      safeLog('Clave secreta no configurada');
      return NextResponse.json(
        { error: 'Clave secreta no configurada en el servidor' },
        { status: 500 }
      );
    }

    safeLog('Variables de entorno verificadas');

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    safeLog('Enviando petición a Google reCAPTCHA');

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();
    safeLog('Respuesta de Google recibida', {
      success: data.success,
      score: data.score,
      hasErrorCodes: !!data['error-codes'],
    });

    if (!data.success) {
      safeLog('Verificación fallida', { errorCodes: data['error-codes'] });
      return NextResponse.json(
        {
          error: 'Verificación de reCAPTCHA fallida',
          details: data['error-codes'],
        },
        { status: 400 }
      );
    }

    if (data.score < 0.5) {
      safeLog('Puntuación demasiado baja', { score: data.score });
      return NextResponse.json(
        { error: 'Puntuación de reCAPTCHA demasiado baja', score: data.score },
        { status: 400 }
      );
    }

    safeLog('Verificación exitosa', { score: data.score });
    return NextResponse.json(
      { message: 'Verificación exitosa', score: data.score },
      { status: 200 }
    );
  } catch (error) {
    safeLog('Error general en el endpoint', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Error interno al verificar reCAPTCHA' },
      { status: 500 }
    );
  }
}

// Add handlers for other HTTP methods for debugging
export async function GET() {
  safeLog('Petición GET recibida - no permitida');
  return NextResponse.json(
    {
      error: 'Método GET no permitido',
      allowedMethods: ['POST'],
      endpoint: '/api/verify-recaptcha',
    },
    { status: 405 }
  );
}

export async function OPTIONS() {
  safeLog('Petición OPTIONS recibida');
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'POST',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
