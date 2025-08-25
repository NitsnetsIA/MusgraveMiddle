import { Request, Response } from 'express';
import { musgraveSftpService } from '../services/musgrave-sftp.js';
import net from 'net';

/**
 * Endpoint para probar la conectividad básica de red al servidor SFTP
 */
export async function testNetworkConnectivity(req: Request, res: Response) {
  try {
    console.log('🌐 Probando conectividad de red al servidor SFTP...');
    
    const host = 'musgraveapp.blob.core.windows.net';
    const port = 22;
    
    console.log(`🔍 Intentando conectar a ${host}:${port}...`);
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;
      
      // Timeout después de 10 segundos
      const timeout = setTimeout(() => {
        if (!connected) {
          socket.destroy();
          console.log('⏱️ Timeout de conexión de red');
          res.status(504).json({
            success: false,
            message: 'Timeout de conexión de red',
            details: `No se pudo conectar a ${host}:${port} en 10 segundos`,
            timestamp: new Date().toISOString()
          });
          resolve(undefined);
        }
      }, 10000);
      
      socket.on('connect', () => {
        connected = true;
        clearTimeout(timeout);
        console.log('✅ Conexión de red exitosa');
        socket.destroy();
        
        res.json({
          success: true,
          message: 'Conectividad de red exitosa',
          details: `Conexión TCP establecida a ${host}:${port}`,
          timestamp: new Date().toISOString()
        });
        resolve(undefined);
      });
      
      socket.on('error', (error: any) => {
        if (!connected) {
          clearTimeout(timeout);
          console.log('❌ Error de conectividad de red:', error.message);
          
          let errorMessage = 'Error de conectividad de red';
          if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Conexión rechazada - El puerto está bloqueado o el servicio no está disponible';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Host no encontrado - Verificar la dirección del servidor';
          } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout de conexión - El servidor no responde';
          }
          
          res.status(503).json({
            success: false,
            message: errorMessage,
            error: {
              code: error.code,
              details: error.message,
              timestamp: new Date().toISOString()
            }
          });
          resolve(undefined);
        }
      });
      
      socket.connect(port, host);
    });
    
  } catch (error: any) {
    console.error('💥 Error en test de conectividad de red:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno en el test de conectividad',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Endpoint para obtener información del sistema y dependencias
 */
export async function getSystemInfo(req: Request, res: Response) {
  try {
    console.log('🔍 Obteniendo información del sistema...');
    
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    };
    
    console.log('📋 Información del sistema:', systemInfo);
    
    res.json({
      success: true,
      message: 'Información del sistema obtenida',
      systemInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 Error obteniendo información del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno obteniendo información del sistema',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Endpoint para probar la conexión SFTP con Musgrave
 */
export async function testSftpConnection(req: Request, res: Response) {
  try {
    console.log('🔍 Probando conexión SFTP con Musgrave...');
    console.log('📋 Request headers:', req.headers);
    console.log('📋 Request method:', req.method);
    console.log('📋 Request URL:', req.url);
    
    const result = await musgraveSftpService.testConnection();
    
    if (result) {
      console.log('✅ Test de conexión SFTP exitoso');
      res.json({
        success: true,
        message: 'Conexión SFTP exitosa con Musgrave',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Test de conexión SFTP falló');
      res.status(500).json({
        success: false,
        message: 'Error en la conexión SFTP con Musgrave',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('💥 Error en test SFTP:', error);
    console.error('📋 Detalles del error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      level: error.level,
      description: error.description,
      stack: error.stack,
      cause: error.cause
    });
    
    // Determinar el tipo de error y dar una respuesta más específica
    let errorMessage = 'Error desconocido en la prueba SFTP';
    let statusCode = 500;
    
    if (error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Conexión rechazada - El servidor SFTP no está disponible o el puerto está bloqueado';
      statusCode = 503;
    } else if (error.message?.includes('ETIMEDOUT')) {
      errorMessage = 'Timeout de conexión - El servidor SFTP no responde';
      statusCode = 504;
    } else if (error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Host no encontrado - Verificar la dirección del servidor SFTP';
      statusCode = 400;
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Error de autenticación - Verificar usuario y contraseña';
      statusCode = 401;
    } else if (error.message?.includes('permission')) {
      errorMessage = 'Error de permisos - El usuario no tiene acceso al servidor';
      statusCode = 403;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: {
        name: error.name,
        code: error.code,
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}