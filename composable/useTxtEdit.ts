import { reactive, ref } from 'vue';

export const useTxtEdits = () => {
    const getText = async (name:string) => {
        return useFetch(`/api/files/${name}`)
    }
        
    return {
        getText
    };
};
