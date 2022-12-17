import {data as Data} from ".prisma/client";
import React, {useEffect, useState} from "react";
import Swal from "sweetalert2";
import {Column, usePagination, useTable} from "react-table";

interface DataWithKNN extends Data {
    knn: number
}

interface DataWithKNNAndNeyman extends DataWithKNN {
    neyman: number
}

interface NewData extends Omit<Data, "ID" | "type_credit"> {
}

interface NewDataWithTypeCredit extends NewData {
    type_credit: number
}

export default function CCApp() {
    const [data, setData] = useState<Data[]>([])
    const fetchData = async () => {
        const res = await fetch("/api/data")
        const data = await res.json()
        setData(data)
    }
    useEffect(() => {
        fetchData()
    }, [])
    const sortWithKNN = (newData: NewData): DataWithKNN[] => {
        const dataWithKNN = data.map((d) => {
            let caseMatch = 0
            if (d.Age === newData.Age) caseMatch++
            if (d.Gender === newData.Gender) caseMatch++
            if (d.Salary === newData.Salary) caseMatch++
            if (d.Job === newData.Job) caseMatch++
            if (d.Married === newData.Married) caseMatch++
            if (d.Num_children === newData.Num_children) caseMatch++
            return {
                ...d,
                knn: caseMatch / 6
            }
        });
        return dataWithKNN.sort((a, b) => b.knn - a.knn)
    }

    const sortWithNeyman = (newData: NewData): DataWithKNNAndNeyman[] => {
        const dataWithKNN = sortWithKNN(newData)
        return dataWithKNN.map((d) => {
            const neyman = 1 - (Math.pow((d.knn - 1), 2) / d.knn)
            return {
                ...d,
                neyman
            }
        })
    }
    const [age, setAge] = useState(-1)
    const [gender, setGender] = useState(false)
    const [salary, setSalary] = useState(-1)
    const [job, setJob] = useState(false)
    const [married, setMarried] = useState(false)
    const [numChildren, setNumChildren] = useState(-1)
    const [result, setResult] = useState<DataWithKNNAndNeyman[]>([])
    const [newData, setNewData] = useState<NewData | null>(null)

    const handleCalculate = () => {
        if (age === -1 || salary === -1 || numChildren === -1) return
        const _newData: NewData = {
            Age: age,
            Gender: gender ? "M" : "F",
            Salary: salary,
            Job: job ? "Y" : "N",
            Married: married ? "Y" : "N",
            Num_children: numChildren
        }
        setNewData(_newData)
        const dataWithNeyman = sortWithNeyman(_newData)
        setResult(dataWithNeyman)
    }

    useEffect(() => {
        handleCalculate()
    }, [age, gender, salary, job, married, numChildren])

    const [selectedID, setSelectedID] = useState(-1)
    useEffect(() => {
        setSelectedID(result[0]?.ID ?? -1)
    }, [result])

    const handleSubmitNewData = () => {
        if (newData === null) return
        const dataWithTypeCredit: NewDataWithTypeCredit = {
            ...newData,
            type_credit: data.find((d) => d.ID === selectedID)?.type_credit ?? -1
        }
        fetch("/api/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataWithTypeCredit)
        }).then(res => res.json()).then(res => {
            setData([...data, res])
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Success adding new data",
                showConfirmButton: false,
                timer: 1500,
            })
        });
    }

    const columns = React.useMemo(
        ()=>[
            {
                Header: "ID",
                accessor: "ID"
            },
            {
                Header: "Age",
                accessor: "Age"
            },
            {
                Header: "Gender",
                accessor: "Gender",
                Cell: ({value}:any)=>{
                    return value === "M" ? "Male" : "Female"
                }
            },
            {
                Header: "Salary",
                accessor: "Salary",
                Cell: ({value}:any)=>{
                    switch (value) {
                        case 0:
                            return "0-250"
                        case 1:
                            return "251-500"
                        case 2:
                            return "501-750"
                        case 3:
                            return "751-1000"
                        case 4:
                            return "1001-1250"
                        case 5:
                            return "1251-1500"
                        case 6:
                            return "1501+"
                    }
                }
            },
            {
                Header: "Job",
                accessor: "Job",
                Cell: ({value}:any)=>{
                    return value === "Y" ? "Yes" : "No"
                }
            },
            {
                Header: "Married",
                accessor: "Married",
                Cell: ({value}:any)=>{
                    return value === "Y" ? "Yes" : "No"
                }
            },
            {
                Header: "Children",
                accessor: "Num_children",
                Cell: ({value}:any)=>{
                    switch (value) {
                        case 0:
                            return "0"
                        case 1:
                            return "1-2"
                        case 2:
                            return "3-4"
                        default:
                            return "5+"
                    }
                }
            },
            {
                Header: "Type Credit",
                accessor: "type_credit",
                Cell: ({value}:any)=>{
                    switch (value) {
                        case 1:
                            return "Approved Regular"
                        case 2:
                            return "Approved Gold"
                        default:
                            return "Rejected"
                    }
                }
            }
        ] as Column<Data>[],[]
    )

    const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} = useTable({
        columns,
        data
    });

    return (
        <div className="flex flex-col w-full h-full min-h-screen bg-gray-900 text-gray-200">
            <div className="text-5xl mx-auto">Credit Card Application</div>
            <div className="text-lg mx-auto mt-2">With Neyman Similarity using KNN Indexing</div>
            <div className="flex flex-col space-y-4 mt-2">
                <div className="bg-gray-800 flex-1 flex flex-col p-2 rounded">
                    <div className="flex justify-between p-4">
                        <select
                            className="block appearance-none bg-gray-800 border border-gray-600 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                            value={age} onChange={(e) => setAge(parseInt(e.target.value))}>
                            <option value={-1}>Age</option>
                            <option value={0}>0-20</option>
                            <option value={1}>21-40</option>
                            <option value={3}>41-60</option>
                            <option value={4}>61+</option>
                        </select>
                        <div>
                            <button
                                className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                onClick={() => setGender(!gender)}>
                                {gender ? "Male" : "Female"}
                            </button>
                        </div>
                        <select
                            className="block appearance-none bg-gray-800 border border-gray-600 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                            value={salary} onChange={(e) => setSalary(parseInt(e.target.value))}>
                            <option value={-1}>Salary USD</option>
                            <option value={0}>0-250</option>
                            <option value={1}>251-500</option>
                            <option value={2}>501-750</option>
                            <option value={3}>751-1000</option>
                            <option value={4}>1001-1250</option>
                            <option value={5}>1251-1500</option>
                            <option value={6}>1501+</option>
                        </select>
                        <div className="flex flex-col justify-center items-center">
                            <label htmlFor="jobCheck" className="flex items-center">Is Having Job</label>
                            <input id="jobCheck" type="checkbox"
                                   className="w-4 h-4 bg-gray-800 border border-gray-600 hover:border-gray-400 rounded-full shadow leading-tight focus:outline-none focus:shadow-outline"
                                   checked={job} onChange={(e) => setJob(e.target.checked)}/>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <label htmlFor="marriedCheck" className="flex items-center">Is Married</label>
                            <input id="marriedCheck" type="checkbox"
                                   className="w-4 h-4 bg-gray-800 border border-gray-600 hover:border-gray-400 rounded-full shadow leading-tight focus:outline-none focus:shadow-outline"
                                   checked={married} onChange={(e) => setMarried(e.target.checked)}/>
                        </div>
                        <select
                            className="block appearance-none bg-gray-800 border border-gray-600 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                            value={numChildren} onChange={(e) => setNumChildren(parseInt(e.target.value))}>
                            <option value={-1}>Child</option>
                            <option value={0}>0</option>
                            <option value={1}>1-2</option>
                            <option value={2}>3-4</option>
                            <option value={3}>5+</option>
                        </select>
                    </div>
                    <div className="flex flex-col space-x-4 bg-gray-700 p-4 mt-2 rounded">
                        <div className="mx-auto">Result</div>
                        <div className="flex-1 flex flex-col w-full space-y-2">
                            {result.length > 0 && (
                                <div className="flex justify-between">
                                    <div className="w-10">ID</div>
                                    <div className="flex-1">Neyman Similarity</div>
                                    <div className="flex-1">Credit Type</div>
                                    <div className="flex-1"></div>
                                </div>
                            )}
                            {result.slice(0, 5).map((d, i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="w-10">{d.ID}</div>
                                    <div className="flex-1">{d.neyman.toFixed(2)}</div>
                                    <div className="flex-1">
                                        {d.type_credit === 0 && (
                                            <div className="bg-gray-500 w-fit p-2 rounded">Not Approved</div>
                                        )}
                                        {d.type_credit === 1 && (
                                            <div className="bg-blue-500 w-fit p-2 rounded">Approved Regular</div>
                                        )}
                                        {d.type_credit === 2 && (
                                            <div className="bg-yellow-700 w-fit p-2 rounded">Approved Gold</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <button
                                            className={(selectedID == d.ID ? `bg-green-800 border-green-600` : `bg-gray-800 border-gray-600`) + ` border px-4 py-2 rounded shadow leading-tight focus:outline-none focus:shadow-outline`}
                                            onClick={() => setSelectedID(d.ID)}>{selectedID === d.ID ? "Selected" : "Select"}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSubmitNewData} className="mt-2 bg-gray-600 hover:bg-gray-500 text-gray-300 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Input to Database</button>
                    </div>
                </div>
                <div className="bg-gray-800 flex-1 flex p-2 rounded max-h-96 overflow-auto">
                    <table className="flex-grow divide-y divide-gray-200 shadow">
                        <thead className="bg-gray-700 text-gray-200">
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>
                                        {column.render("Header")}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody {...getTableBodyProps()} className="bg-gray-700 divide-y divide-gray-200">
                        {rows.map((row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell, idx) => {
                                        return (
                                            <td {...cell.getCellProps()}
                                                className={`px-6 py-4 whitespace-no-wrap ` + ((idx === 2) ? `w-50` : null)}>
                                                {cell.render("Cell")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 whitespace-no-wrap text-center">
                                    Tidak ada data
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
