import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { default as convict_config } from '../config/config';

function timestamp() {
  return Math.floor(Date.now() / 1000);
}

export interface ICache {
  ttl: number;
  __v: number;
}

interface IKElementCache<T> {
  getElement(uuid: string): Promise<T>;

  getElementFromDB<T>(uuid: string): Promise<AxiosResponse<{ data: T }>>;

  getElementVersion<T>(uuid: string): Promise<AxiosResponse<{ data: T }>>;
}

interface config {
  ttl: number;
  rootURLPath: string;
}

interface IVersion {
  __v: number;
  time: number;
}

/**
 * @author Nico Wagner
 * @version 1.0.0
 * @since 0.1.0 21.07.2021 15:29
 * @class
 * @classdesc Caches given types of data with the ability to update it with an api
 */
export class ElementCache<T extends ICache> implements IKElementCache<T> {
  private readonly config: config;
  private cacheMapOfElements: Map<string, T> = new Map();
  private cacheMapOfElementsVersions: Map<string, IVersion> = new Map();
  protected axios: AxiosInstance;

  constructor(config: config) {
    this.config = config;
    this.axios = axios.create({
      baseURL: convict_config.get('apiurl') + config.rootURLPath,
    });
  }

  /**
   * Function to overwrite the method to get a element **version** of the DB
   * @param {string} uuid The Element UUID
   * @return T as Promise
   * @author Nico Wagner
   * @version 1.2.0
   * @since 0.0.2 04.07.2021
   * @override
   */
  getElementVersion<T>(uuid: string) {
    return this.axios.get<{ data: T }>(uuid + '/version');
  }

  /**
   * Function to overwrite the method to get a element of the DB
   * @param {string}uuid The Element UUID
   * @return T as Promise
   * @author Nico Wagner
   * @version 1.2.0
   * @since 0.0.2 04.07.2021
   * @override
   */
  getElementFromDB<T>(uuid: string) {
    return this.axios.get<{ data: T }>(uuid);
  }

  /**
   * @param {string} uuid The Element UUID
   * @return T as Promise
   * @author Nico Wagner
   * @version 1.2.0
   * @since 0.0.2 04.07.2021
   * @protected
   */
  //@ts-ignore
  public async getElement(uuid: string): Promise<T> {
    const element = this.cacheMapOfElements.get(uuid);
    if (element && element.ttl > timestamp()) {
      //element is available
      return element;
    } else {
      //element is missing or expired
      //check element version in DB
      if (element) {
        //if element is only expired
        const templateVersionDB = await this.getElementVersion<T>(uuid); //todo catch timeout //todo catch
        // todo 404 error
        console.log(uuid);
        console.log(templateVersionDB.data);
        if (templateVersionDB.data.data.__v !== element.__v) {
          //if version is newer than local version
          return await this.updateTemplateFromDB(uuid);
        } else if (templateVersionDB.data.data.__v === element.__v) {
          //if versions are the same
          element.ttl = timestamp() + this.config.ttl;
          return element;
        }
      } else {
        //fetch all of DB
        return await this.updateTemplateFromDB(uuid);
      }
    }
    //return element;
  }

  /**
   * Fetches the element of the DB via the REST API and stores it in the map
   * @param {string}uuid The Element UUID
   * @return T as Promise
   * @author Nico Wagner
   * @version 1.2.0
   * @since 0.0.2 04.07.2021
   * @private
   */
  private async updateTemplateFromDB(uuid: string): Promise<T> {
    const elementDB = await this.getElementFromDB<[T]>(uuid);
    if (elementDB.status !== 200)
      throw new Error('Element ID does not exist: ' + uuid);
    const el = elementDB.data.data[0];
    el.ttl = timestamp() + this.config.ttl;
    this.cacheMapOfElements.set(uuid, el);
    this.cacheMapOfElementsVersions.set(uuid, {
      __v: el.__v,
      time: timestamp(),
    });
    return el;
  }
}
