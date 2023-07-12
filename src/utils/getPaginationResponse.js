export default async function 
    getPaginationResponse(data, pagination, page, limit) {
        if(pagination === 'false'){
            return await data
        };

        const currentPage =  page? page : 1;
        const perPage = limit? limit : 10;

        const response = await data.paginate({ perPage: perPage, currentPage: currentPage , isLengthAware: true });

        let nextPage = parseInt(response.pagination.currentPage) +1;

        nextPage > response.pagination.lastPage? nextPage = null : nextPage

        return {
            pagination:{
                currentPage: parseInt(response.pagination.currentPage),
                from: response.pagination.from+1,
                to: response.pagination.to,
                perPage: parseInt(response.pagination.perPage),
                prevPage: response.pagination.prevPage,
                nextPage,
                totalPages: response.pagination.lastPage,
                totalRows: response.pagination.total
            },
            data: response.data
        };
    }