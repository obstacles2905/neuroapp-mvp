/** Где категория показывается в приложении по умолчанию */
export enum CategoryCatalogAudience {
  /** Основной каталог для всех пользователей */
  PRODUCTION = 'production',
  /** Тест / закрытый запуск — не в дефолтной выдаче; можно открывать по флагу */
  EXPERIMENTAL = 'experimental',
}
