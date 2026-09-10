export const DEFAULT_INTERVALS_KEY = '2qy6c4q96l80r56e1ga2n6dbr';
export const DEFAULT_INTERVALS_ATHLETE = 'i482617';
export const DEFAULT_TP_COOKIE =
  'Production_tpAuth=V001Iy6QCIU8QUqXO9M_lgkAxsUgsj9vzhxvMZyooZw_fO2PrLDmAFKthOywzXVTTq0dS0J-9V8rEcMA2VfuZWZlZE45gP68dp3OFzJNYVQMWs8sRLb4d4RnrbQidSxuOR2PfgNN5m2pZqg7vQaz-khtjVATzB-SLcm7TMbsx_xLBuFj51rtaCOA_7LRzSnBMXpim7eX8SzeuolmhKDKU_FR1eZfrfp4tfuxDbXh6u-0Etq6VFlFOmTLMQu2VlLnzp2fxushpPpO5VkOIlBgXBTGhUZnsa30-MY8rV7GOvQm_AL5F7WeRwbx-7S6imp9TqBQhkbES5losACZRXK8LKDFp8KI48qEmCfqrBgMxYrCqy12qam5be0eqZ8eP8P4_WJYd475yyhwxfBjd5S3DvQ-f5xtEkfDf15JXNFWalgsqq0-4NenUw9MOgZhZns0NFc9ztMUtbDFzd4YlaQjiRUMtwGyNhjRleMu6vDao19TX8_a3MfvXQIS9Qun1AQjxPIdWbKUjFVGzuP06Qv_BJxO5eyD36w4mny8wgkgfV48cVi8_jrz22-tRGr3mfh4Qx2XhH5ki_k7GV5EE0CAKKA0Yq0qDjO4hyR_uJm_Ot1AUcWzZrg7WmvxCmPpmgVqXhFvwSk2I5h0v7ugv2GhyBSeL7_ZMlFjxTzu_V3CS3817Pe0hDTO6S_u74cXk4x4o1htdj8e54dQlJVvNsCux7STwKRSCaJA5opPwsTcsEcyznRELQJDAebwlcVjVJG2W3ZZHD-Nttn12otKi-8kgzcQI9hz5fL7IVGKXS8K79DiJyrj9wQvuZYG_0QDmJpSSKnKtkKPaQ474m4k3Qrq6VMVDYtL5XEWgUXLkLjjq9LDgKIYiTsLkXTowXdKJDS8FnpkMw7FcAk560oLuePgxFZ4s54LjKSASM6YjS6xuF9u6-3nvcGfnYRLammR3yvyBS2r_Qwu0G-DQqpKqqKQ3ezKlPS_Et4pgS47PNDXG9QDTGkVoVErb7iB4gmBxHuSqwXHIW80aBuaPqMyVXt5e0uCfRbuO4dDqRY1-pQz-rC296YK7H4uiJs3m2VTA5laSD5bXE3MMqMnDoCF3RvlJbHyu_EN83fe7JawHVikrs__znU-ICM2I62SQxMD15urnFOkmmvtHyNYM7M6S79XbmUSwjV4iAoj4bK16KFWtk8L_YOfO7DByiea73XNCa-skfAkzLobIhbkW9999P7tKHDT_imQ-vkdn_JUlNMCNUBJk1mNgj_LkOgVQXf07-MaXStIBwV0IWjnsWgJs3O-NEXq1Q99lnZvlZIfCESkWvTtgWYR1JMgVBYS8Ttc4YZm2rVryQD6DOuVuwwEyxyTMqOWjW5yHYL8Oa4wNRBrINcnRTd4utCvs7gTt_pDtOmmaiz6LnWr_2uMPCv8eBNgV0JqkltIyhhrJ-iiTAvxn9Gg0ea5Ibwy__csDu1o4l6QLvfF_dEKCvHzqmSH0LGONcMrpJDTbL5bDENPVKg6duHkqq-AapGjMJtYaduDmxHZJH0CURGj4U9zseiGXEZyqRF3hAHAVXqw82B1Vs_06sZU5jlLoG2G9SShSijmkfNlhvxVqoAO01YGDgXwNnlb8RYyiUtfuRh9DuJshcnrI1Ebjf5Z1kILReWsgFYKBqwCePnyRWysHrdwHFy3nyP08cPH1ET6EvxGMkBZ_RPPgd_LZn3KzzaekNYVMn0QnaC7-qigi8yKmHUEMZj26gQT2xrRym1l5ShrJ2KSSu7ryfzFBXQ1';

export const STORAGE_KEY = 'intervals_tp_sync_config_v3';

export interface LogItem {
  id: string;
  timestamp: string;
  level: 'info' | 'ok' | 'warn' | 'error';
  message: string;
}

export interface SessionStats {
  uploaded: number;
  skipped: number;
  errors: number;
}

export interface ActivityItem {
  id: string | number;
  name: string;
  type: string;
  start_date_local: string;
  moving_time?: number;
  elapsed_time?: number;
  distance?: number;
  total_elevation_gain?: number;
  icu_training_load?: number;
  average_heartrate?: number;
  average_watts?: number;
  has_fit?: boolean;
}

export interface PlannedWorkoutItem {
  id: string | number;
  name: string;
  type: string;
  start_date_local: string;
  moving_time?: number;
  duration?: number;
  icu_training_load?: number;
  description?: string;
  workout_doc?: any;
  indoor?: boolean;
  category?: string;
}

export interface ConnectionStatus {
  tested: boolean;
  intervals?: { ok: boolean; data?: any; error?: string };
  tp?: { ok: boolean; data?: any; error?: string };
}

export type ViewMode = 'auto' | 'mobile' | 'desktop';
export type SyncMode = 'planned' | 'completed';
export type MobileTab = 'workouts' | 'credentials' | 'logs';
