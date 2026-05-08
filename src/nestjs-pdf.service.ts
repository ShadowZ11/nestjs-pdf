import { Injectable } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { PuppeteerParameters } from './puppeteer/puppeteer-parameters.interface';
import { addSignatureFieldUsingAnchor } from '@/helpers/signature.helper';

@Injectable()
export class NestjsPdfService {
  constructor(private readonly puppeteerService: PuppeteerService) {}

  /**
   * @param html
   * @param options
   * @returns PDF généré à partir du HTML fourni
   * @description Cette méthode utilise le service Puppeteer pour générer un PDF à partir d'une chaîne HTML. Les options de génération peuvent être personnalisées en passant un objet `PuppeteerParameters` en second argument. Cela permet de contrôler divers aspects du rendu du PDF, tels que la taille de la page, les marges, l'affichage des arrière-plans, etc. Si aucune option n'est fournie, les paramètres par défaut définis dans le service Puppeteer seront utilisés.
   */
  generatePdfFromHtml(html: string, options?: PuppeteerParameters) {
    return this.puppeteerService.generatePdfFromHtml(html, options);
  }

  /**
   * @param template
   * @param parameters
   * @param options
   * @returns PDF généré à partir du template Handlebars fourni, avec les paramètres appliqués
   * @description Cette méthode génère un PDF à partir d'un template Handlebars fourni sous forme de chaîne de caractères. Les paramètres à injecter dans le template sont passés dans l'objet `parameters`, qui est utilisé pour rendre le template avant de le convertir en PDF. Les options de génération du PDF peuvent également être personnalisées en passant un objet `PuppeteerParameters` en troisième argument. Cela permet de contrôler divers aspects du rendu du PDF, tels que la taille de la page, les marges, l'affichage des arrière-plans, etc. Si aucune option n'est fournie, les paramètres par défaut définis dans le service Puppeteer seront utilisés.
   */
  generatePdfFromTemplateString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromTemplateString(
      template,
      parameters,
      options,
    );
  }

  /**
   * @param file
   * @param parameters
   * @param options
   * @returns PDF généré à partir du template Handlebars situé à l'emplacement de fichier fourni, avec les paramètres appliqués
   * @description Cette méthode génère un PDF à partir d'un template Handlebars situé à l'emplacement de fichier spécifié. Le chemin du fichier est passé en tant que chaîne de caractères dans le paramètre `file`. Les paramètres à injecter dans le template sont passés dans l'objet `parameters`, qui est utilisé pour rendre le template avant de le convertir en PDF. Les options de génération du PDF peuvent également être personnalisées en passant un objet `PuppeteerParameters` en troisième argument. Cela permet de contrôler divers aspects du rendu du PDF, tels que la taille de la page, les marges, l'affichage des arrière-plans, etc. Si aucune option n'est fournie, les paramètres par défaut définis dans le service Puppeteer seront utilisés.
   */
  generatePdfFromTemplateFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromTemplateFile(
      file,
      parameters,
      options,
    );
  }

  /**
   * @param pdf
   * @param fieldName
   * @param anchorText
   * @returns PDF modifié avec un champ de signature ajouté à la position de l'ancre
   * @description Cette méthode ajoute un champ de signature à un PDF en utilisant une ancre textuelle comme référence pour la position du champ. Elle utilise la fonction `addSignatureFieldUsingAnchor` qui trouve l'ancre dans le PDF et insère un champ de signature à cet endroit. Le champ de signature est nommé selon le paramètre `fieldName` et l'ancre est définie par `anchorText`.
   * Exemple d'utilisation :
   * ```typescript
   * const modifiedPdf = await pdfService.addSignatureFieldSignatureDebtorRaw(
   *   originalPdfBytes,
   *   'SignatureDebtor',
   *   '__SIG_DEBTOR_ANCHOR__'
   * );
   * ```
   * Dans cet exemple, `originalPdfBytes` est un tableau d'octets représentant le PDF original, `SignatureDebtor` est le nom du champ de signature à ajouter, et `__SIG_DEBTOR_ANCHOR__` est le texte d'ancre utilisé pour positionner le champ de signature dans le PDF.
   * Si l'ancre n'est pas trouvée, le champ de signature sera ajouté à une position par défaut (centré en bas de la dernière page).
   * Note : Assurez-vous que le PDF d'entrée contient l'ancre définie par `anchorText` pour que le champ de signature soit positionné correctement. Sinon, il sera ajouté à une position par défaut.
   */
  async addSignatureFieldSignatureDebtorRaw(
    pdf: Uint8Array | Buffer,
    fieldName: string = 'SignatureDebtor',
    anchorText: string = '__SIG_DEBTOR_ANCHOR__',
  ) {
    return await addSignatureFieldUsingAnchor(pdf, fieldName, anchorText);
  }
}
