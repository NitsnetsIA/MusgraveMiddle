import { PurchaseOrder, purchaseOrderItems } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Importar db directamente desde drizzle
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface MusgraveSftpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

const MUSGRAVE_CONFIG: MusgraveSftpConfig = {
  host: 'musgraveapp.blob.core.windows.net',
  port: 22,
  username: 'musgraveapp.musgraveapp',
  password: 'fMPatTqKM9KKTrPLosMigiDC9MdNMtUT'
};

interface PurchaseOrderCSVData {
  purchase_order_id: string;
  user_email: string;
  store_id: string;
  status: string;
  subtotal: number;
  tax_total: number;
  final_total: number;
  server_sent_at: string;
  created_at: string;
  updated_at: string;
  item_ean: string;
  item_ref: string;
  item_title: string;
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
}

export class MusgraveSftpService {
  private sftp: any;

  constructor() {
    // Inicializamos sftp como null, lo crearemos dinámicamente
    this.sftp = null;
  }

  /**
   * Conecta al servidor SFTP de Musgrave
   */
  private async connect(): Promise<void> {
    try {
      // Importar SftpClient dinámicamente
      const SftpClient = (await import('ssh2-sftp-client')).default;
      this.sftp = new SftpClient();
      
      await this.sftp.connect(MUSGRAVE_CONFIG);
      console.log('✓ Conexión SFTP establecida con Musgrave');
    } catch (error: any) {
      console.error('✗ Error conectando al SFTP de Musgrave:', error);
      throw new Error(`Failed to connect to Musgrave SFTP: ${error?.message || error}`);
    }
  }

  /**
   * Desconecta del servidor SFTP
   */
  private async disconnect(): Promise<void> {
    try {
      await this.sftp.end();
      console.log('✓ Desconectado del SFTP de Musgrave');
    } catch (error: any) {
      console.error('✗ Error desconectando del SFTP:', error);
    }
  }

  /**
   * Convierte una purchase order a formato CSV con sus items
   */
  private async convertPurchaseOrderToCSV(purchaseOrder: PurchaseOrder): Promise<string> {
    // Obtener los items de la purchase order
    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchase_order_id, purchaseOrder.purchase_order_id));

    // Preparar datos para CSV
    const csvData: PurchaseOrderCSVData[] = [];

    if (items.length === 0) {
      // Si no hay items, crear una línea con datos de la purchase order solamente
      csvData.push({
        purchase_order_id: purchaseOrder.purchase_order_id,
        user_email: purchaseOrder.user_email,
        store_id: purchaseOrder.store_id,
        status: purchaseOrder.status,
        subtotal: purchaseOrder.subtotal,
        tax_total: purchaseOrder.tax_total,
        final_total: purchaseOrder.final_total,
        server_sent_at: purchaseOrder.server_sent_at?.toISOString() || '',
        created_at: purchaseOrder.created_at.toISOString(),
        updated_at: purchaseOrder.updated_at.toISOString(),
        item_ean: '',
        item_ref: '',
        item_title: '',
        quantity: 0,
        base_price_at_order: 0,
        tax_rate_at_order: 0
      });
    } else {
      // Crear una línea por cada item
      for (const item of items) {
        csvData.push({
          purchase_order_id: purchaseOrder.purchase_order_id,
          user_email: purchaseOrder.user_email,
          store_id: purchaseOrder.store_id,
          status: purchaseOrder.status,
          subtotal: purchaseOrder.subtotal,
          tax_total: purchaseOrder.tax_total,
          final_total: purchaseOrder.final_total,
          server_sent_at: purchaseOrder.server_sent_at?.toISOString() || '',
          created_at: purchaseOrder.created_at.toISOString(),
          updated_at: purchaseOrder.updated_at.toISOString(),
          item_ean: item.item_ean,
          item_ref: item.item_ref || '',
          item_title: item.item_title || '',
          quantity: item.quantity,
          base_price_at_order: item.base_price_at_order,
          tax_rate_at_order: item.tax_rate_at_order
        });
      }
    }

    // Crear archivo CSV temporal
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${purchaseOrder.purchase_order_id}.csv`);

    // Importar csv-writer dinámicamente
    const createCsvWriterModule = await import('csv-writer');
    const csvWriter = createCsvWriterModule.createObjectCsvWriter({
      path: tempFilePath,
      header: [
        { id: 'purchase_order_id', title: 'purchase_order_id' },
        { id: 'user_email', title: 'user_email' },
        { id: 'store_id', title: 'store_id' },
        { id: 'status', title: 'status' },
        { id: 'subtotal', title: 'subtotal' },
        { id: 'tax_total', title: 'tax_total' },
        { id: 'final_total', title: 'final_total' },
        { id: 'server_sent_at', title: 'server_sent_at' },
        { id: 'created_at', title: 'created_at' },
        { id: 'updated_at', title: 'updated_at' },
        { id: 'item_ean', title: 'item_ean' },
        { id: 'item_ref', title: 'item_ref' },
        { id: 'item_title', title: 'item_title' },
        { id: 'quantity', title: 'quantity' },
        { id: 'base_price_at_order', title: 'base_price_at_order' },
        { id: 'tax_rate_at_order', title: 'tax_rate_at_order' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    console.log(`✓ Archivo CSV creado: ${tempFilePath}`);
    
    return tempFilePath;
  }

  /**
   * Envía una purchase order al SFTP de Musgrave en formato CSV
   */
  public async sendPurchaseOrderToMusgrave(purchaseOrder: PurchaseOrder): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Enviando purchase order ${purchaseOrder.purchase_order_id} a Musgrave SFTP...`);
      
      // Conectar al SFTP
      await this.connect();

      // Convertir purchase order a CSV
      tempFilePath = await this.convertPurchaseOrderToCSV(purchaseOrder);

      // Verificar que existe la carpeta de destino
      const remotePath = '/in/purchase_orders';
      const remoteFileName = `${purchaseOrder.purchase_order_id}.csv`;
      const remoteFilePath = `${remotePath}/${remoteFileName}`;

      // Subir el archivo
      await this.sftp.put(tempFilePath, remoteFilePath);
      console.log(`✓ Purchase order ${purchaseOrder.purchase_order_id} enviada exitosamente a Musgrave SFTP: ${remoteFilePath}`);

    } catch (error: any) {
      console.error(`✗ Error enviando purchase order ${purchaseOrder.purchase_order_id} a Musgrave:`, error);
      throw new Error(`Failed to send purchase order to Musgrave: ${error?.message || error}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          console.log(`✓ Archivo temporal eliminado: ${tempFilePath}`);
        } catch (cleanupError: any) {
          console.warn(`⚠️ Error eliminando archivo temporal: ${cleanupError?.message || cleanupError}`);
        }
      }

      // Desconectar del SFTP
      await this.disconnect();
    }
  }

  /**
   * Prueba la conexión SFTP con Musgrave
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      
      // Verificar que existe la carpeta de destino
      const remotePath = '/in/purchase_orders';
      const exists = await this.sftp.exists(remotePath);
      
      if (exists) {
        console.log(`✓ Carpeta ${remotePath} existe en el SFTP de Musgrave`);
      } else {
        console.warn(`⚠️ Carpeta ${remotePath} no encontrada en el SFTP de Musgrave`);
      }

      await this.disconnect();
      return true;
    } catch (error: any) {
      console.error('✗ Test de conexión SFTP fallido:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio
export const musgraveSftpService = new MusgraveSftpService();