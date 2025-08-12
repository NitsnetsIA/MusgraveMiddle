import { Request, Response } from 'express';
import { musgraveSftpService } from '../services/musgrave-sftp.js';

/**
 * Endpoint para probar la conexión SFTP con Musgrave
 */
export async function testSftpConnection(req: Request, res: Response) {
  try {
    console.log('🔍 Probando conexión SFTP con Musgrave...');
    
    const result = await musgraveSftpService.testConnection();
    
    if (result) {
      res.json({
        success: true,
        message: 'Conexión SFTP exitosa con Musgrave',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error en la conexión SFTP con Musgrave',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Error en test SFTP:', error);
    res.status(500).json({
      success: false,
      message: `Error en la prueba SFTP: ${error?.message || error}`,
      timestamp: new Date().toISOString()
    });
  }
}