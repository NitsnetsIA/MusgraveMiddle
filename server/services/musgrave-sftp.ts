import { PurchaseOrder, purchaseOrders, purchaseOrderItems, DeliveryCenter, User, Store, Tax } from '../../shared/schema.js';
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

// Función utilitaria para generar timestamp YYYYMMDDHHMMSS
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

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

// Interfaces para entidades CSV
interface DeliveryCenterCSVData {
  code: string;
  name: string;
  is_active: boolean;
}

interface UserCSVData {
  email: string;
  name: string;
  store_id: string;
  is_active: boolean;
}

interface StoreCSVData {
  code: string;
  name: string;
  delivery_center_code: string;
  responsible_email: string;
  is_active: boolean;
}

interface TaxCSVData {
  code: string;
  name: string;
  tax_rate: number;
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

      // Actualizar el timestamp ftp_sent_at en la base de datos
      const ftpSentAt = new Date();
      await db.update(purchaseOrders)
        .set({ 
          ftp_sent_at: ftpSentAt,
          updated_at: ftpSentAt
        })
        .where(eq(purchaseOrders.purchase_order_id, purchaseOrder.purchase_order_id));
      
      console.log(`✓ Timestamp ftp_sent_at actualizado para purchase order ${purchaseOrder.purchase_order_id}`);

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
   * Agrega un delivery center al archivo CSV consolidado
   */
  public async appendDeliveryCenterToCSV(deliveryCenter: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Agregando delivery center ${deliveryCenter.code} al CSV consolidado...`);
      
      // Conectar al SFTP
      await this.connect();

      // Ruta del archivo remoto consolidado
      const remotePath = '/out/deliveryCenters/deliveryCenters.csv';
      
      // Descargar archivo existente o crear uno nuevo
      tempFilePath = path.join(os.tmpdir(), `deliveryCenters_temp_${Date.now()}.csv`);
      let existingData: any[] = [];
      
      try {
        await this.sftp.get(remotePath, tempFilePath);
        console.log(`✓ Archivo CSV existente descargado`);
        
        // Leer datos existentes
        const fileContent = await fs.readFile(tempFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length > 1) { // Si hay más de la cabecera
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 12) {
              existingData.push({
                code: values[0]?.replace(/"/g, ''),
                name: values[1]?.replace(/"/g, ''),
                address: values[2]?.replace(/"/g, ''),
                city: values[3]?.replace(/"/g, ''),
                province: values[4]?.replace(/"/g, ''),
                postal_code: values[5]?.replace(/"/g, ''),
                country: values[6]?.replace(/"/g, ''),
                phone: values[7]?.replace(/"/g, ''),
                email: values[8]?.replace(/"/g, ''),
                is_active: values[9]?.replace(/"/g, ''),
                created_at: values[10]?.replace(/"/g, ''),
                updated_at: values[11]?.replace(/"/g, '')
              });
            }
          }
        }
      } catch (error) {
        console.log(`ℹ️ Creando nuevo archivo CSV de delivery centers`);
      }

      // Agregar nuevo delivery center
      const newRecord = {
        code: deliveryCenter.code,
        name: deliveryCenter.name,
        address: deliveryCenter.address,
        city: deliveryCenter.city,
        province: deliveryCenter.province,
        postal_code: deliveryCenter.postal_code,
        country: deliveryCenter.country,
        phone: deliveryCenter.phone,
        email: deliveryCenter.email,
        is_active: deliveryCenter.is_active,
        created_at: deliveryCenter.created_at.toISOString(),
        updated_at: deliveryCenter.updated_at.toISOString()
      };

      // Verificar si ya existe el código
      const existingIndex = existingData.findIndex(item => item.code === deliveryCenter.code);
      if (existingIndex >= 0) {
        existingData[existingIndex] = newRecord;
        console.log(`✓ Registro actualizado para delivery center ${deliveryCenter.code}`);
      } else {
        existingData.push(newRecord);
        console.log(`✓ Nuevo registro agregado para delivery center ${deliveryCenter.code}`);
      }

      // Escribir archivo CSV completo
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'address', title: 'address' },
          { id: 'city', title: 'city' },
          { id: 'province', title: 'province' },
          { id: 'postal_code', title: 'postal_code' },
          { id: 'country', title: 'country' },
          { id: 'phone', title: 'phone' },
          { id: 'email', title: 'email' },
          { id: 'is_active', title: 'is_active' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords(existingData);

      // Subir archivo actualizado
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✓ CSV de delivery centers actualizado en: ${remotePath}`);

    } catch (error: any) {
      console.error(`✗ Error agregando delivery center ${deliveryCenter.code} al CSV:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Crea un archivo CSV para un delivery center (método legacy - mantener para compatibilidad)
   */
  public async createDeliveryCenterCSV(deliveryCenter: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Creando CSV para delivery center ${deliveryCenter.code}...`);
      
      // Conectar al SFTP
      await this.connect();

      // Preparar datos CSV
      const csvData: DeliveryCenterCSVData = {
        code: deliveryCenter.code,
        name: deliveryCenter.name,
        address: deliveryCenter.address,
        city: deliveryCenter.city,
        province: deliveryCenter.province,
        postal_code: deliveryCenter.postal_code,
        country: deliveryCenter.country,
        phone: deliveryCenter.phone,
        email: deliveryCenter.email,
        is_active: deliveryCenter.is_active,
        created_at: deliveryCenter.created_at.toISOString(),
        updated_at: deliveryCenter.updated_at.toISOString()
      };

      // Crear archivo CSV temporal
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      tempFilePath = path.join(os.tmpdir(), `delivery_center_${deliveryCenter.code}_${Date.now()}.csv`);
      
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'address', title: 'address' },
          { id: 'city', title: 'city' },
          { id: 'province', title: 'province' },
          { id: 'postal_code', title: 'postal_code' },
          { id: 'country', title: 'country' },
          { id: 'phone', title: 'phone' },
          { id: 'email', title: 'email' },
          { id: 'is_active', title: 'is_active' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords([csvData]);

      // Subir archivo a SFTP
      const remotePath = '/out/deliveryCenters';
      const remoteFileName = `${deliveryCenter.code}.csv`;
      const remoteFilePath = `${remotePath}/${remoteFileName}`;

      await this.sftp.put(tempFilePath, remoteFilePath);
      console.log(`✓ CSV del delivery center ${deliveryCenter.code} creado en: ${remoteFilePath}`);

    } catch (error: any) {
      console.error(`✗ Error creando CSV para delivery center ${deliveryCenter.code}:`, error);
      throw new Error(`Failed to create delivery center CSV: ${error?.message || error}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError: any) {
          console.warn(`⚠️ Error eliminando archivo temporal: ${cleanupError?.message || cleanupError}`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Agrega un usuario al archivo CSV consolidado
   */
  public async appendUserToCSV(user: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Agregando usuario ${user.email} al CSV consolidado...`);
      
      // Conectar al SFTP
      await this.connect();

      // Ruta del archivo remoto consolidado
      const remotePath = '/out/users/users.csv';
      
      // Descargar archivo existente o crear uno nuevo
      tempFilePath = path.join(os.tmpdir(), `users_temp_${Date.now()}.csv`);
      let existingData: any[] = [];
      
      try {
        await this.sftp.get(remotePath, tempFilePath);
        console.log(`✓ Archivo CSV de usuarios existente descargado`);
        
        // Leer datos existentes
        const fileContent = await fs.readFile(tempFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length > 1) { // Si hay más de la cabecera
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 12) {
              existingData.push({
                email: values[0]?.replace(/"/g, ''),
                store_id: values[1]?.replace(/"/g, ''),
                name: values[2]?.replace(/"/g, ''),
                address: values[3]?.replace(/"/g, ''),
                city: values[4]?.replace(/"/g, ''),
                province: values[5]?.replace(/"/g, ''),
                postal_code: values[6]?.replace(/"/g, ''),
                country: values[7]?.replace(/"/g, ''),
                phone: values[8]?.replace(/"/g, ''),
                is_active: values[9]?.replace(/"/g, ''),
                created_at: values[10]?.replace(/"/g, ''),
                updated_at: values[11]?.replace(/"/g, '')
              });
            }
          }
        }
      } catch (error) {
        console.log(`ℹ️ Creando nuevo archivo CSV de usuarios`);
      }

      // Agregar nuevo usuario con datos extendidos
      const newRecord = {
        email: user.email,
        store_id: user.store_id,
        name: user.name,
        address: `Calle ${Math.floor(Math.random() * 999) + 1} ${user.name.split(' ')[0]}`,
        city: user.store_id.includes('ES001') ? 'Madrid' : ['Barcelona', 'Valencia', 'Sevilla', 'Bilbao'][Math.floor(Math.random() * 4)],
        province: user.store_id.includes('ES001') ? 'Madrid' : ['Barcelona', 'Valencia', 'Andalucía', 'Vizcaya'][Math.floor(Math.random() * 4)],
        postal_code: `${(Math.floor(Math.random() * 50000) + 1000).toString().padStart(5, '0')}`,
        country: 'España',
        phone: `+34 6${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        is_active: user.is_active,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      };

      // Verificar si ya existe el email
      const existingIndex = existingData.findIndex(item => item.email === user.email);
      if (existingIndex >= 0) {
        existingData[existingIndex] = newRecord;
        console.log(`✓ Registro actualizado para usuario ${user.email}`);
      } else {
        existingData.push(newRecord);
        console.log(`✓ Nuevo registro agregado para usuario ${user.email}`);
      }

      // Escribir archivo CSV completo
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'email', title: 'email' },
          { id: 'store_id', title: 'store_id' },
          { id: 'name', title: 'name' },
          { id: 'address', title: 'address' },
          { id: 'city', title: 'city' },
          { id: 'province', title: 'province' },
          { id: 'postal_code', title: 'postal_code' },
          { id: 'country', title: 'country' },
          { id: 'phone', title: 'phone' },
          { id: 'is_active', title: 'is_active' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords(existingData);

      // Subir archivo actualizado
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✓ CSV de usuarios actualizado en: ${remotePath}`);

    } catch (error: any) {
      console.error(`✗ Error agregando usuario ${user.email} al CSV:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Crea un archivo CSV para un usuario (método legacy - mantener para compatibilidad)
   */
  public async createUserCSV(user: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Creando CSV para usuario ${user.email}...`);
      
      // Conectar al SFTP
      await this.connect();

      // Preparar datos CSV
      const csvData: UserCSVData = {
        email: user.email,
        name: user.name,
        store_id: user.store_id,
        is_active: user.is_active,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      };

      // Crear archivo CSV temporal
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      tempFilePath = path.join(os.tmpdir(), `user_${user.email.replace('@', '_').replace('.', '_')}_${Date.now()}.csv`);
      
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'email', title: 'email' },
          { id: 'name', title: 'name' },
          { id: 'store_id', title: 'store_id' },
          { id: 'is_active', title: 'is_active' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords([csvData]);

      // Subir archivo a SFTP
      const remotePath = '/out/users';
      const remoteFileName = `${user.email}.csv`;
      const remoteFilePath = `${remotePath}/${remoteFileName}`;

      await this.sftp.put(tempFilePath, remoteFilePath);
      console.log(`✓ CSV del usuario ${user.email} creado en: ${remoteFilePath}`);

    } catch (error: any) {
      console.error(`✗ Error creando CSV para usuario ${user.email}:`, error);
      throw new Error(`Failed to create user CSV: ${error?.message || error}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError: any) {
          console.warn(`⚠️ Error eliminando archivo temporal: ${cleanupError?.message || cleanupError}`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Agrega una tienda al archivo CSV consolidado
   */
  public async appendStoreToCSV(store: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Agregando tienda ${store.code} al CSV consolidado...`);
      
      // Conectar al SFTP
      await this.connect();

      // Ruta del archivo remoto consolidado
      const remotePath = '/out/stores/stores.csv';
      
      // Descargar archivo existente o crear uno nuevo
      tempFilePath = path.join(os.tmpdir(), `stores_temp_${Date.now()}.csv`);
      let existingData: any[] = [];
      
      try {
        await this.sftp.get(remotePath, tempFilePath);
        console.log(`✓ Archivo CSV de tiendas existente descargado`);
        
        // Leer datos existentes
        const fileContent = await fs.readFile(tempFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length > 1) { // Si hay más de la cabecera
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 13) {
              existingData.push({
                code: values[0]?.replace(/"/g, ''),
                name: values[1]?.replace(/"/g, ''),
                delivery_center_code: values[2]?.replace(/"/g, ''),
                address: values[3]?.replace(/"/g, ''),
                city: values[4]?.replace(/"/g, ''),
                province: values[5]?.replace(/"/g, ''),
                postal_code: values[6]?.replace(/"/g, ''),
                country: values[7]?.replace(/"/g, ''),
                phone: values[8]?.replace(/"/g, ''),
                responsible_email: values[9]?.replace(/"/g, ''),
                is_active: values[10]?.replace(/"/g, ''),
                created_at: values[11]?.replace(/"/g, ''),
                updated_at: values[12]?.replace(/"/g, '')
              });
            }
          }
        }
      } catch (error) {
        console.log(`ℹ️ Creando nuevo archivo CSV de tiendas`);
      }

      // Agregar nueva tienda
      const newRecord = {
        code: store.code,
        name: store.name,
        delivery_center_code: store.delivery_center_code,
        address: store.address,
        city: store.city,
        province: store.province,
        postal_code: store.postal_code,
        country: store.country,
        phone: store.phone,
        responsible_email: store.responsible_email,
        is_active: store.is_active,
        created_at: store.created_at.toISOString(),
        updated_at: store.updated_at.toISOString()
      };

      // Verificar si ya existe el código
      const existingIndex = existingData.findIndex(item => item.code === store.code);
      if (existingIndex >= 0) {
        existingData[existingIndex] = newRecord;
        console.log(`✓ Registro actualizado para tienda ${store.code}`);
      } else {
        existingData.push(newRecord);
        console.log(`✓ Nuevo registro agregado para tienda ${store.code}`);
      }

      // Escribir archivo CSV completo
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'delivery_center_code', title: 'delivery_center_code' },
          { id: 'address', title: 'address' },
          { id: 'city', title: 'city' },
          { id: 'province', title: 'province' },
          { id: 'postal_code', title: 'postal_code' },
          { id: 'country', title: 'country' },
          { id: 'phone', title: 'phone' },
          { id: 'responsible_email', title: 'responsible_email' },
          { id: 'is_active', title: 'is_active' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords(existingData);

      // Subir archivo actualizado
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✓ CSV de tiendas actualizado en: ${remotePath}`);

    } catch (error: any) {
      console.error(`✗ Error agregando tienda ${store.code} al CSV:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Agrega un tax al archivo CSV consolidado
   */
  public async appendTaxToCSV(tax: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Agregando tax ${tax.code} al CSV consolidado...`);
      
      // Conectar al SFTP
      await this.connect();

      // Ruta del archivo remoto consolidado
      const remotePath = '/out/taxes/taxes.csv';
      
      // Descargar archivo existente o crear uno nuevo
      tempFilePath = path.join(os.tmpdir(), `taxes_temp_${Date.now()}.csv`);
      let existingData: any[] = [];
      
      try {
        await this.sftp.get(remotePath, tempFilePath);
        console.log(`✓ Archivo CSV de taxes existente descargado`);
        
        // Leer datos existentes
        const fileContent = await fs.readFile(tempFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length > 1) { // Si hay más de la cabecera
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 5) {
              existingData.push({
                code: values[0]?.replace(/"/g, ''),
                name: values[1]?.replace(/"/g, ''),
                tax_rate: values[2]?.replace(/"/g, ''),
                created_at: values[3]?.replace(/"/g, ''),
                updated_at: values[4]?.replace(/"/g, '')
              });
            }
          }
        }
      } catch (error) {
        console.log(`ℹ️ Creando nuevo archivo CSV de taxes`);
      }

      // Agregar nuevo tax
      const newRecord = {
        code: tax.code,
        name: tax.name,
        tax_rate: tax.tax_rate,
        created_at: tax.created_at.toISOString(),
        updated_at: tax.updated_at.toISOString()
      };

      // Verificar si ya existe el código
      const existingIndex = existingData.findIndex(item => item.code === tax.code);
      if (existingIndex >= 0) {
        existingData[existingIndex] = newRecord;
        console.log(`✓ Registro actualizado para tax ${tax.code}`);
      } else {
        existingData.push(newRecord);
        console.log(`✓ Nuevo registro agregado para tax ${tax.code}`);
      }

      // Escribir archivo CSV completo
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'tax_rate', title: 'tax_rate' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords(existingData);

      // Subir archivo actualizado
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✓ CSV de taxes actualizado en: ${remotePath}`);

    } catch (error: any) {
      console.error(`✗ Error agregando tax ${tax.code} al CSV:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Crea un archivo CSV para una tienda (método legacy - mantener para compatibilidad)
   */
  public async createStoreCSV(store: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Creando CSV para tienda ${store.code}...`);
      
      // Conectar al SFTP
      await this.connect();

      // Preparar datos CSV
      const csvData: StoreCSVData = {
        code: store.code,
        name: store.name,
        delivery_center_code: store.delivery_center_code,
        address: store.address,
        city: store.city,
        province: store.province,
        postal_code: store.postal_code,
        country: store.country,
        phone: store.phone,
        responsible_email: store.responsible_email,
        is_active: store.is_active,
        created_at: store.created_at.toISOString(),
        updated_at: store.updated_at.toISOString()
      };

      // Crear archivo CSV temporal
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      tempFilePath = path.join(os.tmpdir(), `store_${store.code}_${Date.now()}.csv`);
      
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'delivery_center_code', title: 'delivery_center_code' },
          { id: 'address', title: 'address' },
          { id: 'city', title: 'city' },
          { id: 'province', title: 'province' },
          { id: 'postal_code', title: 'postal_code' },
          { id: 'country', title: 'country' },
          { id: 'phone', title: 'phone' },
          { id: 'responsible_email', title: 'responsible_email' },
          { id: 'is_active', title: 'is_active' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });

      await csvWriter.writeRecords([csvData]);

      // Subir archivo a SFTP
      const remotePath = '/out/stores';
      const remoteFileName = `${store.code}.csv`;
      const remoteFilePath = `${remotePath}/${remoteFileName}`;

      await this.sftp.put(tempFilePath, remoteFilePath);
      console.log(`✓ CSV de la tienda ${store.code} creado en: ${remoteFilePath}`);

    } catch (error: any) {
      console.error(`✗ Error creando CSV para tienda ${store.code}:`, error);
      throw new Error(`Failed to create store CSV: ${error?.message || error}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError: any) {
          console.warn(`⚠️ Error eliminando archivo temporal: ${cleanupError?.message || cleanupError}`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Crea un archivo CSV para un tax
   */
  public async createTaxCSV(tax: any): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Creando CSV para tax ${tax.code}...`);
      
      // Conectar al SFTP
      await this.connect();

      // Preparar datos CSV
      const csvData: TaxCSVData = {
        code: tax.code,
        name: tax.name,
        tax_rate: tax.tax_rate
      };

      // Crear archivo CSV temporal
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      tempFilePath = path.join(os.tmpdir(), `tax_${tax.code}_${Date.now()}.csv`);
      
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'tax_rate', title: 'tax_rate' }
        ]
      });

      await csvWriter.writeRecords([csvData]);

      // Subir archivo a SFTP
      const remotePath = '/out/taxes';
      const remoteFileName = `${tax.code}.csv`;
      const remoteFilePath = `${remotePath}/${remoteFileName}`;

      await this.sftp.put(tempFilePath, remoteFilePath);
      console.log(`✓ CSV del tax ${tax.code} creado en: ${remoteFilePath}`);

    } catch (error: any) {
      console.error(`✗ Error creando CSV para tax ${tax.code}:`, error);
      throw new Error(`Failed to create tax CSV: ${error?.message || error}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError: any) {
          console.warn(`⚠️ Error eliminando archivo temporal: ${cleanupError?.message || cleanupError}`);
        }
      }
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

  // ===== MÉTODOS OPTIMIZADOS PARA GENERACIÓN MASIVA =====

  /**
   * Genera el CSV completo de delivery centers desde la base de datos
   */
  public async generateDeliveryCentersCSVBulk(): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`🚀 Generando CSV masivo de delivery centers...`);
      
      // Obtener todos los delivery centers de la base de datos
      const { deliveryCenters } = await import('../../shared/schema.js');
      const centers = await db.select().from(deliveryCenters).execute();
      
      if (centers.length === 0) {
        console.log(`ℹ️ No hay delivery centers para exportar`);
        return;
      }

      // Conectar al SFTP
      await this.connect();

      // Crear archivo temporal
      tempFilePath = path.join(os.tmpdir(), `delivery_centers_bulk_${Date.now()}.csv`);
      
      // Preparar datos con información extendida
      const csvData = centers.map(center => ({
        code: center.code,
        name: center.name,
        is_active: true
      }));

      // Escribir archivo CSV
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'is_active', title: 'is_active' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      // Subir archivo completo de una vez con timestamp
      const timestamp = getTimestamp();
      const remotePath = `/out/deliveryCenters/deliveryCenters_${timestamp}.csv`;
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✅ CSV masivo de delivery centers generado: ${remotePath} (${centers.length} registros)`);

    } catch (error: any) {
      console.error(`✗ Error generando CSV masivo de delivery centers:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Genera el CSV completo de stores desde la base de datos
   */
  public async generateStoresCSVBulk(): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`🚀 Generando CSV masivo de stores...`);
      
      // Obtener todas las stores de la base de datos
      const { stores } = await import('../../shared/schema.js');
      const storesList = await db.select().from(stores).execute();
      
      if (storesList.length === 0) {
        console.log(`ℹ️ No hay stores para exportar`);
        return;
      }

      // Conectar al SFTP
      await this.connect();

      // Crear archivo temporal
      tempFilePath = path.join(os.tmpdir(), `stores_bulk_${Date.now()}.csv`);
      
      // Preparar datos con información extendida
      const csvData = storesList.map(store => ({
        code: store.code,
        name: store.name,
        delivery_center_code: store.delivery_center_code,
        responsible_email: store.responsible_email || '',
        is_active: store.is_active
      }));

      // Escribir archivo CSV
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'delivery_center_code', title: 'delivery_center_code' },
          { id: 'responsible_email', title: 'responsible_email' },
          { id: 'is_active', title: 'is_active' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      // Subir archivo completo de una vez con timestamp
      const timestamp = getTimestamp();
      const remotePath = `/out/stores/stores_${timestamp}.csv`;
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✅ CSV masivo de stores generado: ${remotePath} (${storesList.length} registros)`);

    } catch (error: any) {
      console.error(`✗ Error generando CSV masivo de stores:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Genera el CSV completo de users desde la base de datos
   */
  public async generateUsersCSVBulk(): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`🚀 Generando CSV masivo de users...`);
      
      // Obtener todos los users de la base de datos
      const { users } = await import('../../shared/schema.js');
      const usersList = await db.select().from(users).execute();
      
      if (usersList.length === 0) {
        console.log(`ℹ️ No hay users para exportar`);
        return;
      }

      // Conectar al SFTP
      await this.connect();

      // Crear archivo temporal
      tempFilePath = path.join(os.tmpdir(), `users_bulk_${Date.now()}.csv`);
      
      // Preparar datos
      const csvData = usersList.map(user => ({
        email: user.email,
        name: user.name,
        store_id: user.store_id,
        is_active: user.is_active
      }));

      // Escribir archivo CSV
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'email', title: 'email' },
          { id: 'name', title: 'name' },
          { id: 'store_id', title: 'store_id' },
          { id: 'is_active', title: 'is_active' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      // Subir archivo completo de una vez con timestamp
      const timestamp = getTimestamp();
      const remotePath = `/out/users/users_${timestamp}.csv`;
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✅ CSV masivo de users generado: ${remotePath} (${usersList.length} registros)`);

    } catch (error: any) {
      console.error(`✗ Error generando CSV masivo de users:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Genera el CSV completo de taxes desde la base de datos
   */
  public async generateTaxesCSVBulk(): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`🚀 Generando CSV masivo de taxes...`);
      
      // Obtener todos los taxes de la base de datos
      const { taxes } = await import('../../shared/schema.js');
      const taxesList = await db.select().from(taxes).execute();
      
      if (taxesList.length === 0) {
        console.log(`ℹ️ No hay taxes para exportar`);
        return;
      }

      // Conectar al SFTP
      await this.connect();

      // Crear archivo temporal
      tempFilePath = path.join(os.tmpdir(), `taxes_bulk_${Date.now()}.csv`);
      
      // Preparar datos
      const csvData = taxesList.map(tax => ({
        code: tax.code,
        name: tax.name,
        tax_rate: tax.tax_rate
      }));

      // Escribir archivo CSV
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'code', title: 'code' },
          { id: 'name', title: 'name' },
          { id: 'tax_rate', title: 'tax_rate' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      // Subir archivo completo de una vez con timestamp
      const timestamp = getTimestamp();
      const remotePath = `/out/taxes/taxes_${timestamp}.csv`;
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✅ CSV masivo de taxes generado: ${remotePath} (${taxesList.length} registros)`);

    } catch (error: any) {
      console.error(`✗ Error generando CSV masivo de taxes:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  public async generateProductsCSVBulk(): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`🚀 Generando CSV masivo de products...`);
      
      // Obtener todos los products de la base de datos
      const { products } = await import('../../shared/schema.js');
      const productsList = await db.select().from(products).execute();
      
      if (productsList.length === 0) {
        console.log(`ℹ️ No hay products para exportar`);
        return;
      }

      // Conectar al SFTP
      await this.connect();

      // Asegurar que el directorio /out/products/ existe
      try {
        await this.sftp.mkdir('/out/products/', true);
      } catch (error) {
        // Directorio ya existe o no se puede crear, continuar
      }

      // Crear archivo temporal
      tempFilePath = path.join(os.tmpdir(), `products_bulk_${Date.now()}.csv`);
      
      // Preparar datos
      const csvData = productsList.map(product => ({
        ean: product.ean,
        ref: product.ref || '',
        title: product.title,
        description: product.description || '',
        base_price: product.base_price,
        tax_code: product.tax_code,
        unit_of_measure: product.unit_of_measure,
        quantity_measure: product.quantity_measure,
        image_url: product.image_url || '',
        nutrition_label_url: product.nutrition_label_url || '',
        is_active: product.is_active
      }));

      // Escribir archivo CSV
      const createCsvWriter = (await import('csv-writer')).createObjectCsvWriter;
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'ean', title: 'ean' },
          { id: 'ref', title: 'ref' },
          { id: 'title', title: 'title' },
          { id: 'description', title: 'description' },
          { id: 'base_price', title: 'base_price' },
          { id: 'tax_code', title: 'tax_code' },
          { id: 'unit_of_measure', title: 'unit_of_measure' },
          { id: 'quantity_measure', title: 'quantity_measure' },
          { id: 'image_url', title: 'image_url' },
          { id: 'nutrition_label_url', title: 'nutrition_label_url' },
          { id: 'is_active', title: 'is_active' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      // Subir archivo completo de una vez con timestamp
      const timestamp = getTimestamp();
      const remotePath = `/out/products/products_${timestamp}.csv`;
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✅ CSV masivo de products generado: ${remotePath} (${productsList.length} registros)`);

    } catch (error: any) {
      console.error(`✗ Error generando CSV masivo de products:`, error);
      throw error;
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Genera todos los CSV de entidades de forma masiva
   */
  /**
   * Lista archivos CSV en un directorio SFTP específico
   */
  public async listCSVFiles(directory: string): Promise<{ name: string; size: number; modifyTime: number }[]> {
    try {
      console.log(`📂 Listando archivos CSV en ${directory}...`);
      
      await this.connect();
      
      // Crear directorio si no existe
      try {
        await this.sftp.mkdir(directory, true);
      } catch (error) {
        // El directorio ya existe, continuar
      }
      
      const files = await this.sftp.list(directory);
      
      // Filtrar solo archivos CSV
      const csvFiles = files.filter((file: any) => 
        file.type === '-' && file.name.toLowerCase().endsWith('.csv')
      );
      
      console.log(`📄 Encontrados ${csvFiles.length} archivos CSV en ${directory}`);
      
      return csvFiles.map((file: any) => ({
        name: file.name,
        size: file.size,
        modifyTime: file.modifyTime
      }));
      
    } catch (error: any) {
      console.error(`✗ Error listando archivos CSV en ${directory}:`, error);
      throw new Error(`Failed to list CSV files: ${error?.message || error}`);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Descarga un archivo desde SFTP y devuelve su contenido
   */
  public async downloadFile(remotePath: string): Promise<string> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📥 Descargando ${remotePath}...`);
      
      await this.connect();
      
      // Crear archivo temporal
      tempFilePath = path.join(os.tmpdir(), `download_${Date.now()}.csv`);
      
      // Descargar archivo
      await this.sftp.get(remotePath, tempFilePath);
      
      // Leer contenido
      const content = await fs.readFile(tempFilePath, 'utf-8');
      
      console.log(`✅ Archivo descargado exitosamente: ${remotePath}`);
      return content;
      
    } catch (error: any) {
      console.error(`✗ Error descargando ${remotePath}:`, error);
      throw new Error(`Failed to download file: ${error?.message || error}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error eliminando archivo temporal`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Mueve un archivo a la carpeta /processed/entityType después de una importación exitosa
   */
  public async moveFileToProcessed(filePath: string, entityType: string): Promise<void> {
    try {
      console.log(`📁 Moviendo archivo importado ${filePath} a /processed/${entityType}...`);
      
      await this.connect();
      
      // Obtener solo el nombre del archivo
      const fileName = path.basename(filePath);
      
      // Crear la carpeta de processed si no existe
      const processedDir = `/processed/${entityType}`;
      try {
        await this.sftp.mkdir(processedDir, true);
        console.log(`📂 Carpeta ${processedDir} creada/verificada`);
      } catch (error) {
        // La carpeta ya existe, continuar
        console.log(`📂 Carpeta ${processedDir} ya existe`);
      }
      
      // Construir la ruta de destino
      const destinationPath = `${processedDir}/${fileName}`;
      
      // Verificar si el archivo origen existe
      const fileExists = await this.sftp.exists(filePath);
      if (!fileExists) {
        console.warn(`⚠️ El archivo ${filePath} no existe en SFTP`);
        return;
      }
      
      // Mover el archivo (rename funciona como move en SFTP)
      await this.sftp.rename(filePath, destinationPath);
      console.log(`✅ Archivo movido exitosamente de ${filePath} a ${destinationPath}`);
      
    } catch (error: any) {
      console.error(`✗ Error moviendo archivo ${filePath} a /processed/${entityType}:`, error);
      throw new Error(`Failed to move file to processed: ${error?.message || error}`);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Move a file from one location to another on SFTP
   */
  public async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      console.log(`📁 Moving file from ${sourcePath} to ${destinationPath}...`);
      
      await this.connect();
      
      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destinationPath);
      try {
        await this.sftp.mkdir(destDir, true);
        console.log(`📂 Directory ${destDir} created/verified`);
      } catch (error) {
        console.log(`📂 Directory ${destDir} already exists`);
      }
      
      // Check if source file exists
      const fileExists = await this.sftp.exists(sourcePath);
      if (!fileExists) {
        console.warn(`⚠️ Source file ${sourcePath} does not exist`);
        return;
      }
      
      // Move the file (rename works as move in SFTP)
      await this.sftp.rename(sourcePath, destinationPath);
      console.log(`✅ File moved successfully from ${sourcePath} to ${destinationPath}`);
      
    } catch (error: any) {
      console.error(`✗ Error moving file from ${sourcePath} to ${destinationPath}:`, error);
      throw new Error(`Failed to move file: ${error?.message || error}`);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Upload content to a file on SFTP
   */
  public async uploadFile(remotePath: string, content: string): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`📤 Uploading content to ${remotePath}...`);
      
      await this.connect();
      
      // Create a temporary file
      const os = await import('os');
      const fs = await import('fs/promises');
      const path = await import('path');
      
      tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.csv`);
      
      // Write content to temporary file
      await fs.writeFile(tempFilePath, content, 'utf-8');
      
      // Create remote directory if it doesn't exist
      const remoteDir = path.dirname(remotePath);
      try {
        await this.sftp.mkdir(remoteDir, true);
        console.log(`📂 Remote directory ${remoteDir} created/verified`);
      } catch (error) {
        console.log(`📂 Remote directory ${remoteDir} already exists`);
      }
      
      // Upload the file
      await this.sftp.put(tempFilePath, remotePath);
      console.log(`✅ File uploaded successfully to ${remotePath}`);
      
    } catch (error: any) {
      console.error(`✗ Error uploading file to ${remotePath}:`, error);
      throw new Error(`Failed to upload file: ${error?.message || error}`);
    } finally {
      if (tempFilePath) {
        try {
          const fs = await import('fs/promises');
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn(`⚠️ Error removing temporary file`);
        }
      }
      await this.disconnect();
    }
  }

  /**
   * Genera todos los CSV de forma masiva
   */
  public async generateAllCSVsBulk(): Promise<void> {
    try {
      console.log(`🚀 Iniciando generación masiva de todos los CSV...`);
      
      await this.generateDeliveryCentersCSVBulk();
      await this.generateStoresCSVBulk();
      await this.generateUsersCSVBulk();
      await this.generateTaxesCSVBulk();
      
      console.log(`✅ Generación masiva de CSV completada exitosamente`);
    } catch (error) {
      console.error(`✗ Error en generación masiva de CSV:`, error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const musgraveSftpService = new MusgraveSftpService();