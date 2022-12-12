export interface BaseModel {
    lastModificationTime: string;
    lastModifierId: string;
    creationTime: string;
    creatorId: string;
    id: string;
}

export interface BaseResponse<T> {
    data: BaseData<T>[];
    included: BaseData<T>[];
    links: {first: string, last: string, self: string},
    meta: {include: string[]},
    pagination: {
        count: number;
        current_page: number;
        per_page: number;
        total: number;
        total_pages: number;
    }
}

export interface BaseData<T> {
    id: string | number;
    attributes: T;
    relationships: {[key: string]: BaseResponse<T>};
    type: string;
}

export interface GetPage {
    page?: number;
    per_page?: number;
    name?: string;
    include?: string;
    params?: string;
    useId?: string;
}

export interface IModel {
    id: string | number;
}

export abstract class IGet {
    constructor(public payload?: any) { }
}

export abstract class ICreateUpdate {
    constructor(public payload: any, public id?: number | string) { }
}

export abstract class IDelete {
    constructor(public id: string | number) { }
}

export class ModelHelper {
    public static nestInclude<T>(response: BaseResponse<T>) {
        try {
            const {data, included} = response
            return data?.map(d => {
                const {relationships} = d                
                return {...d, relationships: relationships ? ModelHelper.nestedRelation(relationships, included) : {}}
            })
        } catch(e) {
            console.log(e);
        }
    }

    public static nestedRelation = (relationships, included) => {
        return Object.keys(relationships).map(key => {
            // get all relation id
            const ids = relationships[key].data.map(nd => nd.id)
            // find all id with type as same as the key
            const found = included?.filter(d => d.type == key && ids.indexOf(d.id) > -1) ?? []
            //recurse relationships data
            const relationResult = found.map(f => ({...f, relationships: f.relationships ? ModelHelper.nestedRelation(f.relationships, included) : {}}))

            return {[key]: relationResult.length > 1 || key == 'activity_log' || key == 'attachment' ? relationResult : relationResult[0]}
        }).reduce((p, c) => ({...p, ...c}))
    }

    public static findInclude = (included, type, id) => {
        const found = included.find(i => i.type == type && i.id == id)
        if (found) return {...found, relationships: ModelHelper.nestedRelation(found.relationships, included)}
        return null
    }

    public static getOnly = (included, type) => {
        return included.filter(i => i.type == type)
            .map(f => ({...f, relationships: ModelHelper.nestedRelation(f.relationships, included)}))
    }
}
