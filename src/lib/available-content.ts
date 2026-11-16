import type {localeContent} from './i18n-content';

/** Bundled examples are available only when every referenced app is publicly present. */
export function availableContent(content:ReturnType<typeof localeContent>,apps:ReadonlyArray<{id:string}>){
  const available=new Set(apps.map(app=>app.id));
  return {...content,
    guides:content.guides.filter(guide=>guide.appIds.length>0&&guide.appIds.every(id=>available.has(id))),
    workflows:content.workflows.filter(workflow=>workflow.steps.some(step=>!!step.appId)&&workflow.steps.every(step=>!step.appId||available.has(step.appId))),
  };
}
