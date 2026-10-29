export declare const TYPERT: {
    package: string;
    face: string;
    schemas: never[];
    model: {
        services: {
            tags: never[];
            description: string;
            members: {
                name: string;
                kind: string;
                signature: string;
            }[];
            types: never[];
            key: string;
            exportName: string;
            summary: string;
            jsDoc: string;
        }[];
        events: never[];
        objects: never[];
    };
    invocations: readonly import("@deepseek-ai/dsh-typert-protocol").InvocationDescriptor[];
};
